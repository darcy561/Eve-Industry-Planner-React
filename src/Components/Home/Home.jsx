import React, { useContext, useEffect, useState } from "react";
import { IsLoggedInContext, MainUserContext } from "../../Context/AuthContext";
import { CircularProgress, Typography } from "@material-ui/core";
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";

export function Home() {
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { refreshMainUser } = useRefreshUser();
  const [pageLoad, updatePageLoad] = useState(true);
  const [loadingText, setLoadingText] = useState("");

  useEffect(async () => {
    if (
      mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) ||
      mainUser.aTokenEXP == null
    ) {
      if (localStorage.getItem("Auth") != null) {
        refreshMainUser(localStorage.getItem("Auth"));
        updatePageLoad(false);
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
