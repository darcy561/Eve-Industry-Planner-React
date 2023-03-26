import { useContext, useMemo } from "react";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { useFirebase } from "./useFirebase";
import { JobArrayContext } from "../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../Context/AuthContext";
import {
  DialogDataContext,
  LoadingTextContext,
  PageLoadContext,
  UserLoginUIContext,
} from "../Context/LayoutContext";
import { decodeJwt } from "jose";
import { trace } from "firebase/performance";
import { functions, performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useAccountManagement } from "./useAccountManagement";
import { httpsCallable } from "firebase/functions";

export function useRefreshUser() {
  const {
    determineUserState,
    userJobSnapshotListener,
    userWatchlistListener,
    userMaindDocListener,
    userGroupDataListener,
  } = useFirebase();
  const { getCharacterInfo } = useAccountManagement();
  const { updateJobArray } = useContext(JobArrayContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateUserUIData } = useContext(UserLoginUIContext);

  const checkAppVersion = httpsCallable(
    functions,
    "appVersion-checkAppVersion"
  );

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

    let refreshedUser = await RefreshTokens(refreshToken, true);
    let fbToken = await firebaseAuth(refreshedUser);
    await getCharacterInfo(refreshedUser);

    updateUserUIData((prev) => [
      ...prev,
      {
        CharacterID: refreshedUser.CharacterID,
        CharacterName: refreshedUser.CharacterName,
      },
    ]);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSOComp: true,
      charData: true,
    }));

    await determineUserState(fbToken);

    userMaindDocListener(fbToken, refreshedUser);
    userJobSnapshotListener(refreshedUser);
    userWatchlistListener(fbToken, refreshedUser);
    userGroupDataListener(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      charDataComp: true,
      apiData: true,
    }));

    updateLoadingText((prevObj) => ({
      ...prevObj,
      apiDataComp: true,
    }));

    updateJobArray([]);
    updateIsLoggedIn(true);
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
