import { useContext, useEffect } from "react";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { decodeJwt } from "jose";
import { firebaseAuth } from "./firebaseAuth";
import { useFirebase } from "../../Hooks/useFirebase";
import { JobArrayContext } from "../../Context/JobContext";
import { trace } from "@firebase/performance";
import { performance } from "../../firebase";
import {
  PageLoadContext,
  DialogDataContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useAccountManagement } from "../../Hooks/useAccountManagement";
import { UserLogInUI } from "./LoginUI/LoginUI";
import { Buffer } from "buffer";
import useCheckGlobalAppVersion from "../../Hooks/GeneralHooks/useCheckGlobalAppVersion";

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
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateUserUIData, updateLoginInProgressComplete } =
    useContext(UserLoginUIContext);
  const {
    determineUserState,
    userJobSnapshotListener,
    userWatchlistListener,
    userMaindDocListener,
    userGroupDataListener,
  } = useFirebase();
  const { getCharacterInfo } = useAccountManagement();
  const analytics = getAnalytics();

  useEffect(() => {
    async function mainUserLoggin() {
      const t = trace(performance, "MainUserLoginProcessFull");
      t.start();
      const authCode = window.location.search.match(/code=(\S*)&/)[1];
      updateLoginInProgressComplete(false);

      if (!useCheckGlobalAppVersion()) {
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


      if(!authCode) return 

      let userObject = await EveSSOTokens(authCode, true);
      let fbToken = await firebaseAuth(userObject);
      await getCharacterInfo(userObject);
      updateUserUIData((prev) => ({
        ...prev,
        eveLoginComplete: true,
        userArray: [
          {
            CharacterID: userObject.CharacterID,
            CharacterName: userObject.CharacterName,
          },
        ],
        returnState: decodeURIComponent(
          window.location.search.match(/state=(\S*)/)[1]
        ),
      }));
      await determineUserState(fbToken);

      userMaindDocListener(fbToken, userObject);
      userJobSnapshotListener(userObject);
      userWatchlistListener(fbToken, userObject);
      userGroupDataListener(userObject);

      updateUserJobSnapshot([]);
      updateJobArray([]);
      updateIsLoggedIn(true);
      updatePageLoad(false);
      logEvent(analytics, "userSignIn", {
        UID: fbToken.user.uid,
      });
      t.stop();
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

  return <UserLogInUI />;
}

async function EveSSOTokens(authCode, accountType) {
  try {
    const buffer = Buffer.from(
      `${import.meta.env.VITE_eveClientID}:${import.meta.env.VITE_eveSecretKey}`
    );
    const authHeader = `Basic ${buffer.toString("base64")}`;

    const eveTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
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
    this.corporation_id = null;
    this.isOmega = decodedToken.tier === "live" ? true : false;
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
    this.corporation_id = null;
    this.isOmega = decodedToken.tier === "live" ? true : false;
  }
}
