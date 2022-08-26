import { useContext, useEffect } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router";
import jwt from "jsonwebtoken";
import { firebaseAuth } from "./firebaseAuth";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../../Context/JobContext";
import { trace } from "@firebase/performance";
import { performance } from "../../firebase";
import {
  PageLoadContext,
  LoadingTextContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { getAnalytics, logEvent } from "firebase/analytics";
import { RefreshTokens } from "./RefreshToken";
import { EveIDsContext, EvePricesContext } from "../../Context/EveDataContext";
import searchData from "../../RawData/searchIndex.json";
import { useAccountManagement } from "../../Hooks/useAccountManagement";

export function login() {
  const state = "/";
  window.location.href = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(
    process.env.REACT_APP_eveCallbackURL
  )}&client_id=${process.env.REACT_APP_eveClientID}&scope=${
    process.env.REACT_APP_eveScope
  }&state=${state}`;
}

export default function AuthMainUser() {
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUsers } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { serverStatus } = useEveApi();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { determineUserState, getItemPrices } = useFirebase();
  const {
    buildMainUser,
    characterAPICall,
    generateItemPriceRequest,
    getLocationNames,
  } = useAccountManagement();
  const navigate = useNavigate();
  const analytics = getAnalytics();

  useEffect(() => {
    async function mainUserLoggin() {
      const t = trace(performance, "MainUserLoginProcessFull");
      t.start();
      const authCode = window.location.search.match(/code=(\S*)&/)[1];
      const returnState = decodeURIComponent(
        window.location.search.match(/state=(\S*)/)[1]
      );
      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSO: true,
      }));
      let userObject = await EveSSOTokens(authCode, true);
      userObject.fbToken = await firebaseAuth(userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSOComp: true,
        charData: true,
      }));

      const userSettings = await determineUserState(userObject);

      buildMainUser(userObject, userSettings);

      let priceIDRequest = generateItemPriceRequest(userSettings);
      let promiseArray = [getItemPrices(priceIDRequest, userObject)];

      updateLoadingText((prevObj) => ({
        ...prevObj,
        charDataComp: true,
        apiData: true,
      }));

      const sStatus = await serverStatus();

      userObject = await characterAPICall(sStatus, userObject, userObject);

      let apiJobsArray = userObject.apiJobs;
      let userArray = [userObject];
      updateLoadingText((prevObj) => ({
        ...prevObj,
        apiDataComp: true,
      }));

      let failedRefresh = [];
      if (userSettings.settings.account.cloudAccounts) {
        for (let token of userSettings.refreshTokens) {
          let newUser = await RefreshTokens(token.rToken, false);
          if (newUser === "RefreshFail") {
            failedRefresh.push(token.CharacterHash);
          }
          if (token.rToken !== newUser.rToken) {
            token.rToken = newUser.rToken;
          }
          if (newUser !== "RefreshFail") {
            newUser = await characterAPICall(sStatus, newUser, userObject);
            newUser.apiJobs.forEach((i) => {
              apiJobsArray.push(i);
            });
            if (newUser !== undefined) {
              userArray.push(newUser);
            }
          }
        }
      } else {
        let rTokens = JSON.parse(
          localStorage.getItem(`${userObject.CharacterHash} AdditionalAccounts`)
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
                `${userObject.CharacterHash} AdditionalAccounts`,
                JSON.stringify(rTokens)
              );
            }
            if (newUser !== "RefreshFail") {
              newUser = await characterAPICall(sStatus, newUser, userObject);
              apiJobsArray = apiJobsArray.concat(newUser.apiJobs);
              userArray.push(newUser);
            }
          }
        }
      }
      if (failedRefresh.length > 0) {
        if (userObject.settings.account.cloudAccounts) {
          userArray[0].accountRefreshTokens =
            userArray[0].accountRefreshTokens.filter(
              (i) => !failedRefresh.includes(i.CharacterHash)
            );
        } else {
          let oldLS = JSON.parse(
            localStorage.getItem(
              `${userObject.CharacterHash} AdditionalAccounts`
            )
          );
          let newLS = oldLS.filter(
            (i) => !failedRefresh.includes(i.CharacterHash)
          );
          localStorage.setItem(
            `${userObject.CharacterHash} AdditionalAccounts`,
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

      let returnPromiseArray = await Promise.all(promiseArray);
      let newNameArray = await getLocationNames(userArray, userObject);

      updateEveIDs(newNameArray);
      updateEvePrices(returnPromiseArray[0]);
      setJobStatus(userSettings.jobStatusArray);
      updateJobArray(userSettings.jobArraySnapshot);
      updateUsers(userArray);
      updateApiJobs(apiJobsArray);
      updateIsLoggedIn(true);
      updatePageLoad(false);
      logEvent(analytics, "userSignIn", {
        UID: userObject.accountID,
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
      navigate(returnState);
    }
    async function importAccount() {
      const authCode = window.location.search.match(/code=(\S*)&/)[1];
      const userObject = await EveSSOTokens(authCode, false);
      localStorage.setItem("AdditionalUser", JSON.stringify(userObject));
      localStorage.setItem("AddAccountComplete", true);
      window.close();
    }
    if (!isLoggedIn && localStorage.getItem("AddAccount")) {
      importAccount();
    } else {
      mainUserLoggin();
    }
  }, []);

  return <LoadingPage />;
}

async function EveSSOTokens(authCode, accountType) {
  try {
    const eveTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`
          )}`,
          "Content-Type": "application / x-www-form-urlencoded",
          Host: "login.eveonline.com",
          "Access-Control-Allow-Origin": "*",
        },
        body: `grant_type=authorization_code&code=${authCode}`,
      }
    );

    const tokenJSON = await eveTokenPromise.json();

    const decodedToken = jwt.decode(tokenJSON.access_token);

    if (accountType) {
      const newUser = new MainUser(decodedToken, tokenJSON);
      newUser.ParentUser = accountType;
      localStorage.setItem("Auth", tokenJSON.refresh_token);
      return newUser;
    } else {
      const newUser = new SecondaryUser(decodedToken, tokenJSON);
      newUser.ParentUser = accountType;
      return newUser;
    }
  } catch (err) {
    console.log(err);
  }
}

class MainUser {
  constructor(decodedToken, tokenJSON) {
    this.accountID = decodedToken.owner.replace(/[^a-zA-z0-9 ]/g, "");
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.ParentUser = null;
    this.apiSkills = null;
    this.apiJobs = null;
    this.linkedJobs = [];
    this.linkedOrders = [];
    this.linkedTrans = [];
    this.apiOrders = null;
    this.apiHistOrders = null;
    this.apiBlueprints = null;
    this.watchlist = [];
    this.settings = null;
    this.accountRefreshTokens = [];
    this.refreshState = 1;
  }
}
class SecondaryUser {
  constructor(decodedToken, tokenJSON) {
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.rToken = tokenJSON.refresh_token;
    this.ParentUser = null;
    this.apiSkills = null;
    this.apiJobs = null;
    this.apiOrders = null;
    this.apiHistOrders = null;
    this.apiBlueprints = null;
    this.refreshState = 1;
  }
}
