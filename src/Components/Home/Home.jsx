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
import { useEveApi } from "../Hooks/useEveApi";

export function Home() {
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const { CharacterSkills, IndustryJobs, MarketOrders } = useEveApi();
  const [pageload, updatePageload] = useState(true);
  const [loadingText, setLoadingText] =useState("")

  useEffect(async() => {
    const rToken = localStorage.getItem("Auth");
    if (mainUser.aTokenEXP <= Math.floor(Date.now() / 1000) || mainUser.aTokenEXP == null) {
      if (rToken != null) {
        setLoadingText("Logging Into Eve SSO");
        const refreshedUser = await RefreshTokens(rToken);
        refreshedUser.fbToken = await firebaseAuth(refreshedUser);
        setLoadingText("Loading API Data");
        refreshedUser.Skills = await CharacterSkills(refreshedUser);
        refreshedUser.Jobs = await IndustryJobs(refreshedUser);
        refreshedUser.Orders = await MarketOrders(refreshedUser);
        refreshedUser.ParentUser = true;
        setLoadingText("Building Character Object");
        console.log(refreshedUser);
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
    return (<>
      { pageload && <CircularProgress color="primary" />}
        <Typography variant="body2">{loadingText}</Typography>
      </>)
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
