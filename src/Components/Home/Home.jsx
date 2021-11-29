import React, { useContext, useEffect, useState } from "react";
import { IsLoggedInContext, MainUserContext } from "../../Context/AuthContext";
import { CircularProgress, Typography } from "@material-ui/core";
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { LoadingTextContext, PageLoad, PageLoadContext } from "../../Context/LayoutContext";

export function Home() {
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { refreshMainUser } = useRefreshUser();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);
  const { loadingText } = useContext(LoadingTextContext);

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
      <>
        <CircularProgress color="primary" />
        <Typography variant="body2">{loadingText}</Typography>
      </>
    )
  } else {
    if (isLoggedIn) {
      return <LoggedInHome />;
    } else {
      return <LoggedOutHome />;
    }
  }
}
