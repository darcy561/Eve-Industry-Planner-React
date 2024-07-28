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
import { UserLogInUI } from "./LoginUI/LoginUI";
import { Buffer } from "buffer";
import useCheckGlobalAppVersion from "../../Hooks/GeneralHooks/useCheckGlobalAppVersion";
import User from "../../Classes/usersConstructor";

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

      if (!authCode) return;

      const userObject = await EveSSOTokens(authCode, true);
      let fbToken = await firebaseAuth(userObject);
      await userObject.getPublicCharacterData();
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

async function EveSSOTokens(authCode, accountType = false) {
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

    const newUser = new User(decodedToken, tokenJSON, accountType);
    if (accountType) {
      localStorage.setItem("Auth", tokenJSON.refresh_token);
    }
    return newUser;
  } catch (err) {
    console.log(err);
  }
}
