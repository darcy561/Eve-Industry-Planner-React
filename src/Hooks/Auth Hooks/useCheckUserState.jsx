import { useContext, useEffect } from "react";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import {
  PageLoadContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { useRefreshUser } from "../useRefreshUser";

function useCheckUserAuthState() {
  const { updateUsers } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updatePageLoad } = useContext(PageLoadContext);
  const {
    updateLoginInProgressComplete,
    updateUserDataFetch,
    updateUserJobSnapshotDataFetch,
    updateUserWatchlistDataFetch,
    updateUserGroupsDataFetch,
  } = useContext(UserLoginUIContext);
  const { reloadMainUser, refreshUserAccessTokens } = useRefreshUser();

  useEffect(() => {
    authState();
  }, []);

  async function authState() {
    if (isLoggedIn) {
      const newUserArray = await refreshUserAccessTokens();
      updateUsers(newUserArray);
      updatePageLoad(false);
    } else {
      if (!localStorage.getItem("Auth")) {
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
  }
}

export default useCheckUserAuthState;
