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
  const { CharacterSkills, IndustryJobs, MarketOrders } = useEveApi();
  const [Loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("")
  const { determineUserState, downloadCharacterData, downloadCharacterJobs } = useFirebase();
  const navigate = useNavigate();

  useEffect(async () => {
    const t = trace(performance, "MainUserLoginProcessFull");
    const s = trace(performance, "UserJobsTotal")
    t.start();
    const authCode = window.location.search.match(/code=(\S*)&/)[1];
    const returnState = decodeURIComponent(
      window.location.search.match(/state=(\S*)/)[1]
    );
    setLoadingText("Logging Into Eve SSO");
    const userObject = await EveSSOTokens(authCode);
    
    userObject.fbToken = await firebaseAuth(userObject);
    
    determineUserState(userObject);

    setLoadingText("Loading API Data");
    userObject.apiSkills = await CharacterSkills(userObject);
    userObject.apiJobs = await IndustryJobs(userObject);
    userObject.apiOrders = await MarketOrders(userObject);    
    setLoadingText("Downloading Character Data");

    const userSettings = await downloadCharacterData(userObject);
    userObject.accountID = userSettings.accountID;
    const userJobs = await downloadCharacterJobs(userObject);
    s.putMetric("TotalJobs", userJobs.length);

    setJobStatus(userSettings.jobStatusArray);
    updateJobArray(userJobs);
    updateApiJobs(userObject.apiJobs);

    updateIsLoggedIn(true);
    const newArray = [...users];
    newArray.push(userObject);
    updateUsers(newArray);
    updateMainUser(userObject);
    setLoading(false);
    t.stop();
    navigate(returnState);
      
  }, []);

  return (<>
    {Loading && <CircularProgress color="primary" />}
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
    if (
      decodedToken.iss != "login.eveonline.com" &&
      decodedToken.iss !="https://login.eveonline.com"
    ) {
      throw console.error("Invalid Token");
    };

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
    this.Settings = null;
  };
};