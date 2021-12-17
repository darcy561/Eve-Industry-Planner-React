import React, { useContext, useEffect } from "react";
import { IsLoggedInContext, MainUserContext } from "../../Context/AuthContext";
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

export function Home() {
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { refreshMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);

  useEffect(async () => {
    if (
      mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) ||
      mainUser.aTokenEXP == null
    ) {
      if (localStorage.getItem("Auth") != null) {
        refreshMainUser(localStorage.getItem("Auth"));
      } else {
        updateIsLoggedIn(false);
        updatePageLoad(false);
      }
    } else {
      updatePageLoad(false);
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
