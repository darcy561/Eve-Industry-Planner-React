import React, { useContext, useEffect } from "react";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

export function Home() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { RefreshUserAToken, reloadMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);

  useEffect(async () => {
    let parentUser = users.find((u) => u.ParentUser === true) 

    if (isLoggedIn) {
      if (parentUser.aTokenEXP <= Math.floor(Date.now() / 1000)) {
        let newUsersArray = users
        const index = newUsersArray.findIndex((i) => i.ParentUser === true);
        let newParentUser = await RefreshUserAToken(parentUser);
        newUsersArray[index] = newParentUser
        updateUsers(newUsersArray)
      }
      updatePageLoad(false);
    } else {
      if (localStorage.getItem("Auth") == null) {
        updatePageLoad(false);
      } else {
        reloadMainUser(localStorage.getItem("Auth"));
      }
      
    }

  }, []);

  if (pageLoad) {
    return (
      <LoadingPage/>
    )
  } else {
    if (isLoggedIn) {
      return <LoggedInHome />;
    } else {
      return <LoggedOutHome />;
    }
  }
}
