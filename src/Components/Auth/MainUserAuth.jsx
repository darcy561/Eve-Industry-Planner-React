import React, { useContext, useEffect } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useNavigate } from "react-router";
import jwt from "jsonwebtoken";
import { firebaseAuth } from "./firebaseAuth";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../../Context/JobContext";
import { trace } from "@firebase/performance";
import { performance } from "../../firebase";
import {
  PageLoadContext,
  LoadingTextContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

export function login() {
  const state = window.location.pathname;
  window.location.href = `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(
    process.env.REACT_APP_eveCallbackURL
  )}&client_id=${process.env.REACT_APP_eveClientID}&scope=${
    process.env.REACT_APP_eveScope
  }&state=${state}`;
}

export function AuthMainUser() {
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { BlueprintLibrary, CharacterSkills, HistoricMarketOrders, IndustryJobs, MarketOrders, WalletTransactions, WalletJournal } =
    useEveApi();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { determineUserState } = useFirebase();
  const navigate = useNavigate();

  useEffect(async () => {
    if (!isLoggedIn) {
      const t = trace(performance, "MainUserLoginProcessFull");
      t.start();
      const authCode = window.location.search.match(/code=(\S*)&/)[1];
      const returnState = decodeURIComponent(
        window.location.search.match(/state=(\S*)/)[1]
      );
      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSO: true
      }));

      const userObject = await EveSSOTokens(authCode);
      const fbToken = await firebaseAuth(userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSOComp: true,
        charData: true
      }));

      const userSettings = await determineUserState(userObject, fbToken);
      userObject.accountID = userSettings.accountID;
      userObject.linkedJobs = userSettings.linkedJobs;
      userObject.linkedTrans = userSettings.linkedTrans;
      userObject.linkedOrders = userSettings.linkedOrders;
      userObject.settings = userSettings.settings;

      updateLoadingText((prevObj) => ({
        ...prevObj,
        charDataComp: true,
        apiData: true
      }));

      userObject.apiSkills = await CharacterSkills(userObject);
      userObject.apiJobs = await IndustryJobs(userObject);
      userObject.apiOrders = await MarketOrders(userObject);
      userObject.apiHistOrders = await HistoricMarketOrders(userObject);
      userObject.apiBlueprints = await BlueprintLibrary(userObject);
      userObject.apiTransactions = await WalletTransactions(userObject);
      userObject.apiJournal = await WalletJournal(userObject);

      updateLoadingText((prevObj) => ({
        ...prevObj,
        apiDataComp: true
      }));

      console.log(userObject);

      setJobStatus(userSettings.jobStatusArray);
      updateJobArray(userSettings.jobArraySnapshot);
      updateApiJobs(userObject.apiJobs);
      updateUsers([userObject]);

      updateIsLoggedIn(true);
      updatePageLoad(false);
      t.stop();
      updateLoadingText((prevObj) => ({
        ...prevObj,
        eveSSO: false,
        eveSSOComp: false,
        charData: false,
        charDataComp: false,
        apiData: false,
        apiDataComp: false
      }));
      navigate(returnState);
    }
  }, []);
  
  return (
      <LoadingPage/>
  )
}

async function EveSSOTokens(authCode) {
  try {
    const eveTokenPromise = await fetch(
      "https://login.eveonline.com/v2/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`
          )}`,
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
  }
}

class MainUser {
  constructor(decodedToken, tokenJSON) {
    this.accountID = decodedToken.owner.replace(/[^a-zA-z0-9 ]/g, "");
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.ParentUser = true;
    this.apiSkills = null;
    this.apiJobs = null;
    this.linkedJobs = [];
    this.linkedOrders = [];
    this.linkedTrans = [];
    this.apiOrders = null;
    this.apiHistOrders = null;
    this.apiBlueprints = null;
    this.settings = null;
  }
}
