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
  PageLoadContext,
  UserLoginUIContext,
} from "../Context/LayoutContext";
import { decodeJwt } from "jose";
import { trace } from "firebase/performance";
import { functions, performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useAccountManagement } from "./useAccountManagement";
import { httpsCallable } from "firebase/functions";
import { Buffer } from "buffer";

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
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const {
    updateUserUIData,
    updateLoginInProgressComplete,
    updateUserDataFetch,
    updateUserJobSnapshotDataFetch,
    updateUserWatchlistDataFetch,
    updateUserGroupsDataFetch,
  } = useContext(UserLoginUIContext);

  const checkAppVersion = httpsCallable(
    functions,
    "checkAppVersion-checkAppVersion"
  );

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

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
        updateLoginInProgressComplete(true);
        updateUserDataFetch(true);
        updateUserJobSnapshotDataFetch(true);
        updateUserWatchlistDataFetch(true);
        updateUserGroupsDataFetch(true);
      } else {
        reloadMainUser(localStorage.getItem("Auth"));
      }
    }
  };

  const reloadMainUser = async (refreshToken) => {
    const analytics = getAnalytics();
    const t = trace(performance, "MainUserRefreshProcessFull");
    t.start();
    updateLoginInProgressComplete(false);

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
    updateUserUIData((prev) => ({
      ...prev,
      eveLoginComplete: true,
      userArray: [
        {
          CharacterID: refreshedUser.CharacterID,
          CharacterName: refreshedUser.CharacterName,
        },
      ],
    }));

    await determineUserState(fbToken);

    userMaindDocListener(fbToken, refreshedUser);
    userJobSnapshotListener(refreshedUser);
    userWatchlistListener(fbToken, refreshedUser);
    userGroupDataListener(refreshedUser);

    updateJobArray([]);
    updateIsLoggedIn(true);
    updatePageLoad(false);
    logEvent(analytics, "userSignIn", {
      UID: fbToken.user.uid,
    });
    t.stop();
  };

  const RefreshUserAToken = async (user) => {
    try {
      const buffer = Buffer.from(
        `${import.meta.env.VITE_eveClientID}:${
          import.meta.env.VITE_eveSecretKey
        }`
      );
      const authHeader = `Basic ${buffer.toString("base64")}`;

      const newTokenPromise = await fetch(
        "https://login.eveonline.com/v2/oauth/token",
        {
          method: "POST",
          headers: {
            Authorization: authHeader,
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
