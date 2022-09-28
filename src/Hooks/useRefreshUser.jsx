import { useContext, useMemo } from "react";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { useEveApi } from "./useEveApi";
import { useFirebase } from "./useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../Context/AuthContext";
import { LoadingTextContext, PageLoadContext } from "../Context/LayoutContext";
import { decodeJwt } from "jose";
import { trace } from "firebase/performance";
import { performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EveIDsContext } from "../Context/EveDataContext";
import searchData from "../RawData/searchIndex.json";
import { useAccountManagement } from "./useAccountManagement";

export function useRefreshUser() {
  const { serverStatus } = useEveApi();
  const {
    buildMainUser,
    characterAPICall,
    generateItemPriceRequest,
    getLocationNames,
  } = useAccountManagement();
  const {
    determineUserState,
    getItemPrices,
    userJobSnapshotListener,
    userWatchlistListener,
  } = useFirebase();
  const { updateEveIDs } = useContext(EveIDsContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const checkUserState = async () => {
    if (isLoggedIn) {
      if (parentUser.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        let newUsersArray = [...users];
        const index = newUsersArray.findIndex((i) => i.ParentUser);
        newUsersArray[index] = await RefreshUserAToken(parentUser);
        updateUsers(newUsersArray);
      }
      updatePageLoad(false);
    } else {
      if (localStorage.getItem("Auth") == null) {
        updatePageLoad(false);
      } else {
        reloadMainUser(localStorage.getItem("Auth"));
      }
    }
  };

  const reloadMainUser = async (refreshToken) => {
    const analytics = getAnalytics();
    const t = trace(performance, "MainUserRefreshProcessFull");
    t.start();

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: true,
    }));
    updateUserJobSnapshot([]);

    let refreshedUser = await RefreshTokens(refreshToken, true);
    refreshedUser.fbToken = await firebaseAuth(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSOComp: true,
      charData: true,
    }));

    const charSettings = await determineUserState(refreshedUser);

    buildMainUser(refreshedUser, charSettings);
    await userJobSnapshotListener(refreshedUser);
    await userWatchlistListener(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      charDataComp: true,
      apiData: true,
    }));

    const sStatus = await serverStatus();
    refreshedUser = await characterAPICall(
      sStatus,
      refreshedUser,
      refreshedUser
    );

    let apiJobsArray = refreshedUser.apiJobs;
    let userArray = [refreshedUser];

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

    let locationReturns = await getLocationNames(userArray, refreshedUser);

    updateEveIDs(locationReturns);
    setJobStatus(charSettings.jobStatusArray);
    updateJobArray([]);
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
              `${import.meta.env.VITE_eveClientID}:${
                import.meta.env.VITE_eveSecretKey
              }`
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

      const decodedToken = decodeJwt(newTokenJSON.access_token);

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

  return { checkUserState, RefreshUserAToken, reloadMainUser };
}
