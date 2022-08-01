import { useContext } from "react";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { useEveApi } from "./useEveApi";
import { useFirebase } from "./useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { LoadingTextContext, PageLoadContext } from "../Context/LayoutContext";
import jwt from "jsonwebtoken";
import { trace } from "firebase/performance";
import { performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EveIDsContext, EvePricesContext } from "../Context/EveDataContext";
import searchData from "../RawData/searchIndex.json";
import { useAccountManagement } from "./useAccountManagement";

export function useRefreshUser() {
  const { IDtoName, serverStatus } = useEveApi();
  const { characterAPICall, generateItemPriceRequest } = useAccountManagement();
  const { determineUserState, getItemPrices } = useFirebase();
  const { updateEveIDs } = useContext(EveIDsContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUsers } = useContext(UsersContext);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);

  const reloadMainUser = async (refreshToken) => {
    const analytics = getAnalytics();
    const t = trace(performance, "MainUserRefreshProcessFull");
    t.start();

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: true,
    }));
    let userArray = [];
    let refreshedUser = await RefreshTokens(refreshToken, true);
    refreshedUser.fbToken = await firebaseAuth(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSOComp: true,
      charData: true,
    }));

    const charSettings = await determineUserState(refreshedUser);
    refreshedUser.ParentUser = true;
    refreshedUser.accountID = charSettings.accountID;
    refreshedUser.linkedJobs = charSettings.linkedJobs;
    refreshedUser.linkedTrans = charSettings.linkedTrans;
    refreshedUser.linkedOrders = charSettings.linkedOrders;
    refreshedUser.settings = charSettings.settings;
    refreshedUser.snapshotData = JSON.parse(
      JSON.stringify(charSettings.jobArraySnapshot)
    );
    refreshedUser.accountRefreshTokens = charSettings.refreshTokens;
    refreshedUser.watchlist = charSettings.watchlist;
    let priceIDRequest = generateItemPriceRequest(charSettings);
    let promiseArray = [];

    let itemPrices = getItemPrices(priceIDRequest, refreshedUser);
    promiseArray.push(itemPrices);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      charDataComp: true,
      apiData: true,
    }));
    let apiJobsArray = [];
    const sStatus = await serverStatus();
    refreshedUser = await characterAPICall(
      sStatus,
      refreshedUser,
      refreshedUser
    );

    apiJobsArray = apiJobsArray.concat(refreshedUser.apiJobs);
    userArray.push(refreshedUser);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      apiDataComp: true,
    }));

    let failedRefresh = [];
    if (refreshedUser.settings.account.cloudAccounts) {
      for (let token of charSettings.refreshTokens) {
        let newUser = await RefreshTokens(token.rToken, false);
        if (newUser === "RefreshFail") {
          failedRefresh.push(token.CharacterHash);
        }
        if (token.rToken !== newUser.rToken) {
          token.rToken = newUser.rToken;
        }
        if (newUser !== "RefreshFail") {
          newUser = await characterAPICall(sStatus, newUser, refreshedUser);
          userArray.push(newUser);
          apiJobsArray = apiJobsArray.concat(newUser.apiJobs);
        }
      }
    } else {
      let rTokens = JSON.parse(
        localStorage.getItem(
          `${refreshedUser.CharacterHash} AdditionalAccounts`
        )
      );
      if (rTokens !== null) {
        for (let token of rTokens) {
          let newUser = await RefreshTokens(token.rToken, false);
          if (newUser === "RefreshFail") {
            failedRefresh.push(token.CharacterHash);
          }
          if (token.rToken !== newUser.rToken) {
            token.rToken = newUser.rToken;
            localStorage.setItem(
              `${refreshedUser.CharacterHash} AdditionalAccounts`,
              JSON.stringify(rTokens)
            );
          }

          if (newUser !== "RefreshFail") {
            newUser = await characterAPICall(sStatus, newUser, refreshedUser);
            userArray.push(newUser);
            apiJobsArray = apiJobsArray.concat(newUser.apiJobs);
          }
        }
      }
    }
    if (failedRefresh.length > 0) {
      if (refreshedUser.settings.account.cloudAccounts) {
        refreshedUser.accountRefreshTokens =
          refreshedUser.accountRefreshTokens.filter(
            (i) => !failedRefresh.includes(i.CharacterHash)
          );
      } else {
        let oldLS = JSON.parse(
          localStorage.getItem(
            `${refreshedUser.CharacterHash} AdditionalAccounts`
          )
        );
        let newLS = oldLS.filter(
          (i) => !failedRefresh.includes(i.CharacterHash)
        );
        localStorage.setItem(
          `${refreshedUser.CharacterHash} AdditionalAccounts`,
          JSON.stringify(newLS)
        );
      }
    }

    apiJobsArray.sort((a, b) => {
      let aName = searchData.find(
        (i) =>
          i.itemID === a.product_type_id ||
          i.blueprintID === a.blueprint_type_id
      );
      let bName = searchData.find(
        (i) =>
          i.itemID === b.product_type_id ||
          i.blueprintID === b.blueprint_type_id
      );
      if (aName.name < bName.name) {
        return -1;
      }
      if (aName.name > bName.name) {
        return 1;
      }
      return 0;
    });

    let locationIDS = new Set();
    let citadelStore = new Set();
    let newIDNamePromises = [];
    let newNameArray = [];

    for (let user of userArray) {
      let citadelIDs = new Set();
      if (user.ParentUser) {
        if (user.settings.editJob.defaultAssetLocation.toString().length > 10) {
          if (!citadelStore.has(user.settings.editJob.defaultAssetLocation)) {
            citadelIDs.add(user.settings.editJob.defaultAssetLocation);
            citadelStore.add(user.settings.editJob.defaultAssetLocation);
          }
        } else {
          locationIDS.add(user.settings.editJob.defaultAssetLocation);
        }
      }
      user.apiJobs.forEach((job) => {
        if (job.facility_id.toString().length > 10) {
          if (!citadelStore.has(job.facility_id)) {
            citadelIDs.add(job.facility_id);
            citadelStore.add(job.facility_id);
          }
        } else {
          locationIDS.add(job.facility_id);
        }
      });
      user.apiOrders.forEach((order) => {
        if (order.location_id.toString().length > 10) {
          if (!citadelStore.has(order.location_id)) {
            citadelIDs.add(order.location_id);
            citadelStore.add(order.location_id);
          }
        } else {
          locationIDS.add(order.location_id);
        }
        locationIDS.add(order.region_id);
      });
      user.apiHistOrders.forEach((order) => {
        if (order.location_id.toString().length > 10) {
          if (!citadelStore.has(order.location_id)) {
            citadelIDs.add(order.location_id);
            citadelStore.add(order.location_id);
          }
        } else {
          locationIDS.add(order.location_id);
        }
        locationIDS.add(order.region_id);
      });
      if ([...citadelIDs].length > 0) {
        let tempCit = IDtoName([...citadelIDs], user);
        newIDNamePromises.push(tempCit);
      }
    }
    if ([...locationIDS].length > 0) {
      let tempLoc = IDtoName([...locationIDS], refreshedUser);
      newIDNamePromises.push(tempLoc);
    }

    let returnLocations = await Promise.all(newIDNamePromises);

    returnLocations.forEach((group) => {
      newNameArray = newNameArray.concat(group);
    });

    let returnPromiseArray = await Promise.all(promiseArray);
    updateEveIDs(newNameArray);
    updateEvePrices(returnPromiseArray[0]);
    setJobStatus(charSettings.jobStatusArray);
    updateJobArray(charSettings.jobArraySnapshot);
    updateApiJobs(apiJobsArray);
    updateUsers(userArray);
    updateIsLoggedIn(true);
    logEvent(analytics, "userSignIn", {
      UID: refreshedUser.accountID,
    });
    t.stop();
    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: false,
      eveSSOComp: false,
      charData: false,
      charDataComp: false,
      apiData: false,
      apiDataComp: false,
    }));
    updatePageLoad(false);
  };

  const RefreshUserAToken = async (user) => {
    try {
      const newTokenPromise = await fetch(
        "https://login.eveonline.com/v2/oauth/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Host: "login.eveonline.com",
          },
          body: `grant_type=refresh_token&refresh_token=${
            user.ParentUser ? localStorage.getItem("Auth") : user.rToken
          }`,
        }
      );
      const newTokenJSON = await newTokenPromise.json();

      const decodedToken = jwt.decode(newTokenJSON.access_token);

      user.aToken = newTokenJSON.access_token;
      user.aTokenEXP = Number(decodedToken.exp);

      if (user.ParentUser) {
        localStorage.setItem("Auth", newTokenJSON.refresh_token);
      }

      return user;
    } catch (err) {
      console.log(err);
    }
  };

  return { RefreshUserAToken, reloadMainUser };
}
