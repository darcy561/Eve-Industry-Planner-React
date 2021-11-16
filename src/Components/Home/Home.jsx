import React, { useContext, useEffect, useState } from "react";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../Context/AuthContext";
import { RefreshTokens } from "../Auth/RefreshToken";
import { CircularProgress } from "@material-ui/core";
import { firebaseAuth } from "../Auth/firebaseAuth";
<<<<<<< HEAD
import { useEveApi } from "../Hooks/useEveApi";
=======
import { LoggedInHome } from "./Components/LoggedIn";
import { LoggedOutHome } from "./Components/LoggedOut";
>>>>>>> f4168e53cc8808e99188d2f75570c571d592d68f

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
    if (isLoggedIn) {
      return <LoggedInHome/>
    } else {
      return <LoggedOutHome/>
    };
  };
};
