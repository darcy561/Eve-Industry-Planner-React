import { Typography } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../Context/AuthContext";
import { RefreshTokens } from "../Auth/RefreshToken";
import { CircularProgress } from "@material-ui/core";
import { firebaseAuth } from "../Auth/firebaseAuth";

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
    return (
      <>
        <section className="block-section">
          <div id="jobWrapper" className="jobsWrapper"></div>
          <a>Home</a>
          {users.map((user) => {
            return<> <Typography variant="h5">{user.CharacterName}</Typography>
            <Typography variant="h5">{JSON.stringify(isLoggedIn)}</Typography></>;
          })}
        </section>
      </>
    );
  }
}
