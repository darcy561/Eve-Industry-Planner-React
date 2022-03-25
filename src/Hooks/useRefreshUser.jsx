import { useContext } from "react";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { useEveApi } from "./useEveApi";
import { useFirebase } from "./useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { LoadingTextContext, PageLoadContext } from "../Context/LayoutContext";
import jwt from "jsonwebtoken";
import { trace } from "firebase/performance";
import { performance } from "../firebase";
import { getAnalytics, logEvent } from "firebase/analytics";

export function useRefreshUser() {
  const {
    BlueprintLibrary,
    CharacterSkills,
    HistoricMarketOrders,
    IndustryJobs,
    MarketOrders,
    serverStatus,
    WalletTransactions,
    WalletJournal,
  } = useEveApi();
  const { determineUserState } = useFirebase();
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUsers } = useContext(UsersContext);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);

  const reloadMainUser = async (refreshToken) => {
    const analytics = getAnalytics();
    const t = trace(performance, "MainUserRefreshProcessFull");
    t.start();

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: true,
    }));

    const refreshedUser = await RefreshTokens(refreshToken, true);
    refreshedUser.fbToken = await firebaseAuth(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSOComp: true,
      charData: true,
    }));

    const charSettings = await determineUserState(refreshedUser);
    refreshedUser.ParentUser = true;
    refreshedUser.accountID = charSettings.accountID;
    refreshedUser.linkedJobs = charSettings.linkedJobs;
    refreshedUser.linkedTrans = charSettings.linkedTrans;
    refreshedUser.linkedOrders = charSettings.linkedOrders;
    refreshedUser.settings = charSettings.settings;
    refreshedUser.snapshotData = JSON.parse(
      JSON.stringify(charSettings.jobArraySnapshot)
    );
    refreshedUser.accountRefreshTokens = charSettings.refreshTokens;

    updateLoadingText((prevObj) => ({
      ...prevObj,
      charDataComp: true,
      apiData: true,
    }));
    const sStatus = await serverStatus();

    if (sStatus) {
      const [
        skills,
        indJobs,
        orders,
        histOrders,
        blueprints,
        transactions,
        journal,
      ] = await Promise.all([
        CharacterSkills(refreshedUser),
        IndustryJobs(refreshedUser),
        MarketOrders(refreshedUser),
        HistoricMarketOrders(refreshedUser),
        BlueprintLibrary(refreshedUser),
        WalletTransactions(refreshedUser),
        WalletJournal(refreshedUser),
      ]);

      refreshedUser.apiSkills = skills;
      refreshedUser.apiJobs = indJobs;
      refreshedUser.apiOrders = orders;
      refreshedUser.apiHistOrders = histOrders;
      refreshedUser.apiBlueprints = blueprints;
      refreshedUser.apiTransactions = transactions;
      refreshedUser.apiJournal = journal;
    } else {
      refreshedUser.apiSkills = [];
      refreshedUser.apiJobs = [];
      refreshedUser.apiOrders = [];
      refreshedUser.apiHistOrders = [];
      refreshedUser.apiBlueprints = [];
      refreshedUser.apiTransactions = [];
      refreshedUser.apiJournal = [];
    }

    updateLoadingText((prevObj) => ({
      ...prevObj,
      apiDataComp: true,
    }));

    setJobStatus(charSettings.jobStatusArray);
    updateJobArray(charSettings.jobArraySnapshot);
    updateApiJobs(refreshedUser.apiJobs);
    updateUsers([refreshedUser]);

    let secondaryUsers = [];
    let secondaryApiJobs = [];
    for (let token of charSettings.refreshTokens) {
      let newUser = await RefreshTokens(token.rToken, false);
      if (sStatus && newUser !== undefined) {
        const [
          skills,
          indJobs,
          orders,
          histOrders,
          blueprints,
          transactions,
          journal,
        ] = await Promise.all([
          CharacterSkills(newUser),
          IndustryJobs(newUser, refreshedUser),
          MarketOrders(newUser),
          HistoricMarketOrders(newUser),
          BlueprintLibrary(newUser),
          WalletTransactions(newUser),
          WalletJournal(newUser),
        ]);

        newUser.apiSkills = skills;
        newUser.apiJobs = indJobs;
        newUser.apiOrders = orders;
        newUser.apiHistOrders = histOrders;
        newUser.apiBlueprints = blueprints;
        newUser.apiTransactions = transactions;
        newUser.apiJournal = journal;
      } else if (!sStatus) {
        newUser.apiSkills = [];
        newUser.apiJobs = [];
        newUser.apiOrders = [];
        newUser.apiHistOrders = [];
        newUser.apiBlueprints = [];
        newUser.apiTransactions = [];
        newUser.apiJournal = [];
      }
      if (newUser !== undefined) {
        secondaryUsers.push(newUser);
        newUser.apiJobs.forEach((i) => {
          secondaryApiJobs.push(i);
        });
      }
    }
    if (secondaryUsers.length > 0) {
      let newApiJobs = refreshedUser.apiJobs.concat(secondaryApiJobs);
      newApiJobs.sort((a, b) => {
        if (a.product_name < b.product_name) {
          return -1;
        }
        if (a.product_name > b.product_name) {
          return 1;
        }
        return 0;
      });
      updateUsers((prev) => prev.concat(secondaryUsers));
      updateApiJobs(newApiJobs);
    }

    updateIsLoggedIn(true);
    logEvent(analytics, "userSignIn", {
      UID: refreshedUser.accountID,
    });
    t.stop();
    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: false,
      eveSSOComp: false,
      charData: false,
      charDataComp: false,
      apiData: false,
      apiDataComp: false,
    }));
    updatePageLoad(false);
  };

  const RefreshUserAToken = async (user) => {
    try {
      const newTokenPromise = await fetch(
        "https://login.eveonline.com/v2/oauth/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(
              `${process.env.REACT_APP_eveClientID}:${process.env.REACT_APP_eveSecretKey}`
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Host: "login.eveonline.com",
          },
          body: `grant_type=refresh_token&refresh_token=${
            user.ParentUser ? localStorage.getItem("Auth") : user.rToken
          }`,
        }
      );
      const newTokenJSON = await newTokenPromise.json();

      const decodedToken = jwt.decode(newTokenJSON.access_token);

      user.aToken = newTokenJSON.access_token;
      user.aTokenEXP = Number(decodedToken.exp);

      if (user.ParentUser) {
        localStorage.setItem("Auth", newTokenJSON.refresh_token);
      }

      return user;
    } catch (err) {
      console.log(err);
    }
  };

  return { RefreshUserAToken, reloadMainUser };
}
