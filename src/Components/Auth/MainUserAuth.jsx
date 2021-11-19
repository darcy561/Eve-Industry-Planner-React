import React, { useContext, useState, useEffect } from "react";
import { MainUserContext, UsersContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { CircularProgress,Typography } from "@material-ui/core";
import { useHistory } from "react-router";
import jwt from "jsonwebtoken";
import { firebaseAuth } from "./firebaseAuth";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import { JobArrayContext, JobStatusContext } from "../../Context/JobContext";




const appClientID = "9adbd31df9324e6ead444f1ecfdf670d";
const appSecretKey = "1aaX3CsHUmJGr3p0nabmd2EsK4QlsOu8Fj2aGozF";
const urlCallback = encodeURIComponent(
  `${window.location.protocol}//${window.location.hostname}:3000/auth`
);
const scopes = "publicData esi-skills.read_skills.v1 esi-industry.read_character_jobs.v1 esi-markets.read_character_orders.v1";
const baseURl =
  "https://login.eveonline.com/v2/oauth/authorize/?response_type=code";

export function login() {
  const state = window.location.pathname;
  window.location.href = `${baseURl}&redirect_uri=${urlCallback}&client_id=${appClientID}&scope=${scopes}&state=${state}`;
}

export function AuthMainUser() {
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUser } = useContext(MainUserContext);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { CharacterSkills, IndustryJobs, MarketOrders } = useEveApi();
  const [Loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("")
  const { determineUserState, downloadCharacterData, downloadCharacterJobs } = useFirebase();
  const history = useHistory();

  useEffect(async () => {
    const authCode = window.location.search.match(/code=(\S*)&/)[1];
    const returnState = decodeURIComponent(
      window.location.search.match(/state=(\S*)/)[1]
    );
    setLoadingText("Logging Into Eve SSO");
    const userObject = await EveSSOTokens(authCode);
    
    userObject.fbToken = await firebaseAuth(userObject);
    
    determineUserState(userObject);

    setLoadingText("Loading API Data");
    userObject.Skills = await CharacterSkills(userObject);
    userObject.Jobs = await IndustryJobs(userObject);
    userObject.Orders = await MarketOrders(userObject);    
    setLoadingText("Downloading Character Data");

    const charSettings = await downloadCharacterData(userObject);
    const charJobs = await downloadCharacterJobs(userObject);

    setJobStatus(charSettings.jobStatusArray);
    updateJobArray(charJobs);

    updateIsLoggedIn(true);
    const newArray = [...users];
    newArray.push(userObject);
    updateUsers(newArray);
    updateMainUser(userObject);
    setLoading(false);
    history.push(returnState);
      
  }, []);

  return (<>
    {Loading && <CircularProgress color="primary" />}
    <Typography variant="body2">{loadingText}</Typography>
  </>);
};

async function EveSSOTokens(authCode) {
  const encodedCredentials = btoa(`${appClientID}:${appSecretKey}`);
  try {
    const eveTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
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
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.fbToken = null;
    this.ParentUser = true;
    this.Skills = [];
    this.Jobs = [];
    this.Orders = [];
    this.Settings = { accordion: [] };
  };
};