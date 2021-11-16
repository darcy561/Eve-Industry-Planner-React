import React, { useContext, useEffect, useState } from "react";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../Context/AuthContext";
import { RefreshTokens } from "../Auth/RefreshToken";
import { CircularProgress } from "@material-ui/core";
import { firebaseAuth } from "../Auth/firebaseAuth";
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";

export function Home() {
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const [pageload, updatePageload] = useState(true);

  useEffect(async() => {
    const rToken = localStorage.getItem("Auth");
    if (mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) || mainUser.aTokenEXP == null) {
      if (rToken != null) {
        const refreshedUser = await RefreshTokens(rToken);
        refreshedUser.fbToken = await firebaseAuth(refreshedUser);
        refreshedUser.ParentUser = true;
        const newArray = [];
        newArray.push(refreshedUser);
        updateUsers(newArray);
        updateIsLoggedIn(true);
        updateMainUser(refreshedUser);
        updatePageload(false);

      } else {
        updateIsLoggedIn(false);
        updatePageload(false);
      }
    } else {
      updatePageload(false);
    }
  }, []);

  if (pageload) {
    return pageload && <CircularProgress color="primary" />;
  } else {
    if (isLoggedIn) {
      return <LoggedInHome/>
    } else {
      return <LoggedOutHome/>
    };
  };
};
