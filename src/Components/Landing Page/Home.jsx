import React, { useContext, useEffect, useMemo } from "react";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { Dashboard } from "../Dashboard/Dashboard";
import { LoggedOutHome } from "./LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

export function Home() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { RefreshUserAToken, reloadMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);

  let parentUser = useMemo(() => {
    return users.find((u) => u.ParentUser);
  }, [users, isLoggedIn]);

  useEffect(() => {
    async function checkLoginState() {
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
    }
    checkLoginState();
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    if (isLoggedIn) {
      return <Dashboard />;
    } else {
      return <LoggedOutHome />;
    }
  }
}
