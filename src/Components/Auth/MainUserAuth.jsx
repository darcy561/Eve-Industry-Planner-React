import React, { useContext, useState, useEffect } from "react";
import { MainUserContext, UsersContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { CircularProgress,Typography } from "@material-ui/core";
import { useNavigate } from "react-router";
import jwt from "jsonwebtoken";
import { firebaseAuth } from "./firebaseAuth";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import { ApiJobsContext, JobArrayContext, JobStatusContext } from "../../Context/JobContext";
import { trace } from "@firebase/performance";
import { performance } from "../../firebase"
import { PageLoadContext, LoadingTextContext } from "../../Context/LayoutContext";

export function login() {
  const state = window.location.pathname;
  window.location.href = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(process.env.REACT_APP_eveCallbackURL)}&client_id=${process.env.REACT_APP_eveClientID}&scope=${process.env.REACT_APP_eveScope}&state=${state}`;
};

export function AuthMainUser() {
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUser } = useContext(MainUserContext);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { BlueprintLibrary, CharacterSkills, IndustryJobs, MarketOrders } = useEveApi();
  const { pageLoad, updatePageLoad } = useContext(PageLoadContext);
  const { loadingText, updateLoadingText } = useContext(LoadingTextContext);
  const { determineUserState } = useFirebase();
  const navigate = useNavigate();

  useEffect(async () => {
    const t = trace(performance, "MainUserLoginProcessFull");
    t.start();
    const authCode = window.location.search.match(/code=(\S*)&/)[1];
    const returnState = decodeURIComponent(
      window.location.search.match(/state=(\S*)/)[1]
    );
    updateLoadingText("Logging Into Eve SSO");
    const userObject = await EveSSOTokens(authCode);    
    userObject.fbToken = await firebaseAuth(userObject);    
    
    updateLoadingText("Loading API Data");
    userObject.apiSkills = await CharacterSkills(userObject);
    userObject.apiJobs = await IndustryJobs(userObject);
    userObject.apiOrders = await MarketOrders(userObject);
    userObject.apiBlueprints = await BlueprintLibrary(userObject);
    updateLoadingText("Downloading Character Data");

    const userSettings = await determineUserState(userObject);
    userObject.accountID = userSettings.accountID;
    console.log(userObject);
    
    setJobStatus(userSettings.jobStatusArray);
    updateJobArray(userSettings.jobArraySnapshot);
    updateApiJobs(userObject.apiJobs);

    updateIsLoggedIn(true);
    const newArray = [...users];
    newArray.push(userObject);
    updateUsers(newArray);
    updateMainUser(userObject);
    updatePageLoad(false);
    t.stop();
    navigate(returnState);
      
  }, []);

  return (<>
    {pageLoad && <CircularProgress color="primary" />}
    <Typography variant="body2">{loadingText}</Typography>
  </>);
};

async function EveSSOTokens(authCode) {
  try {
    const eveTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`)}`,
          "Content-Type": "application / x-www-form-urlencoded",
          Host: "login.eveonline.com",
          "Access-Control-Allow-Origin": "*",
        },
        body: `grant_type=authorization_code&code=${authCode}`,
      }
    );

    const tokenJSON = await eveTokenPromise.json();

    const decodedToken = jwt.decode(tokenJSON.access_token);

    const newUser = new MainUser(decodedToken, tokenJSON);

    localStorage.setItem("Auth", tokenJSON.refresh_token);
    return newUser;
  } catch (err) {
    console.log(err);
  };
};

class MainUser {
  constructor(decodedToken, tokenJSON) {
    this.accountID = null;
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.fbToken = null;
    this.ParentUser = true;
    this.apiSkills = null;
    this.apiJobs = null;
    this.apiOrders = null;
    this.apiBlueprints = null;
    this.Settings = null;
  };
};