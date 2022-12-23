import { useContext, useEffect } from "react";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router";
import { decodeJwt } from "jose";
import { firebaseAuth } from "./firebaseAuth";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import { JobArrayContext } from "../../Context/JobContext";
import { trace } from "@firebase/performance";
import { functions, performance } from "../../firebase";
import {
  PageLoadContext,
  LoadingTextContext,
  DialogDataContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useAccountManagement } from "../../Hooks/useAccountManagement";
import { httpsCallable } from "firebase/functions";

export function login() {
  const state = "/";
  window.location.href = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(
    import.meta.env.VITE_eveCallbackURL
  )}&client_id=${import.meta.env.VITE_eveClientID}&scope=${
    import.meta.env.VITE_eveScope
  }&state=${state}`;
}

export default function AuthMainUser() {
  const { updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { serverStatus } = useEveApi();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const {
    determineUserState,
    userJobSnapshotListener,
    userWatchlistListener,
    userMaindDocListener,
    userGroupDataListener,
  } = useFirebase();
  const { characterAPICall } = useAccountManagement();
  const checkAppVersion = httpsCallable(
    functions,
    "appVersion-checkAppVersion"
  );
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
      
      let appVersion = await checkAppVersion({ appVersion: __APP_VERSION__ });
      if (!appVersion.data) {
        updateDialogData((prev) => ({
          ...prev,
          buttonText: "Close",
          id: "OutdatedAppVersion",
          open: true,
          title: "Outdated App Version",
          body: "A newer version of the application is available, refresh the page to begin using this.",
        }));
        return;
      }

      updateUserJobSnapshot([]);

      let userObject = await EveSSOTokens(authCode, true);
      let fbToken = await firebaseAuth(userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSOComp: true,
        charData: true,
      }));

      await determineUserState(fbToken);

      userMaindDocListener(fbToken, userObject);
      userJobSnapshotListener(userObject);
      userWatchlistListener(fbToken, userObject);
      userGroupDataListener(userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        charDataComp: true,
        apiData: true,
      }));

      const sStatus = await serverStatus();

      userObject = await characterAPICall(sStatus, userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        apiDataComp: true,
      }));

      updateJobArray([]);
      updateIsLoggedIn(true);
      updatePageLoad(false);
      logEvent(analytics, "userSignIn", {
        UID: fbToken.user.uid,
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
            `${import.meta.env.VITE_eveClientID}:${
              import.meta.env.VITE_eveSecretKey
            }`
          )}`,
          "Content-Type": "application / x-www-form-urlencoded",
          Host: "login.eveonline.com",
          "Access-Control-Allow-Origin": "*",
        },
        body: `grant_type=authorization_code&code=${authCode}`,
      }
    );

    const tokenJSON = await eveTokenPromise.json();

    const decodedToken = decodeJwt(tokenJSON.access_token);

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
    this.linkedJobs = new Set();
    this.linkedOrders = new Set();
    this.linkedTrans = new Set();
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
    this.refreshState = 1;
  }
}
