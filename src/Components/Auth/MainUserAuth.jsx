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
import { getAnalytics, logEvent } from "firebase/analytics";
import { RefreshTokens } from "./RefreshToken";
import { EveIDsContext, EvePricesContext } from "../../Context/EveDataContext";

export function login() {
  // const state = window.location.pathname;
  const state = "/";
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
  const { updateUsers } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const {
    BlueprintLibrary,
    CharacterSkills,
    fullAssetsList,
    HistoricMarketOrders,
    IndustryJobs,
    IDtoName,
    MarketOrders,
    serverStatus,
    WalletTransactions,
    WalletJournal,
  } = useEveApi();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { determineUserState, getItemPrices } = useFirebase();
  const navigate = useNavigate();
  const analytics = getAnalytics();

  useEffect(() => {
    async function mainUserLoggin() {
      if (!isLoggedIn && !localStorage.getItem("AddAccount")) {
        const t = trace(performance, "MainUserLoginProcessFull");
        t.start();
        const authCode = window.location.search.match(/code=(\S*)&/)[1];
        const returnState = decodeURIComponent(
          window.location.search.match(/state=(\S*)/)[1]
        );
        updateLoadingText((prevObj) => ({
          ...prevObj,
          eveSSO: true,
        }));
        let userArray = [];
        const userObject = await EveSSOTokens(authCode, true);
        userObject.fbToken = await firebaseAuth(userObject);

        updateLoadingText((prevObj) => ({
          ...prevObj,
          eveSSOComp: true,
          charData: true,
        }));

        const userSettings = await determineUserState(userObject);
        userObject.accountID = userSettings.accountID;
        userObject.linkedJobs = userSettings.linkedJobs;
        userObject.linkedTrans = userSettings.linkedTrans;
        userObject.linkedOrders = userSettings.linkedOrders;
        userObject.settings = userSettings.settings;
        userObject.snapshotData = JSON.parse(
          JSON.stringify(userSettings.jobArraySnapshot)
        );
        userObject.accountRefreshTokens = userSettings.refreshTokens;
        userObject.watchlist = userSettings.watchlist;

        let priceIDRequest = new Set();
        let promiseArray = [];
        userSettings.jobArraySnapshot.forEach((snap) => {
          snap.materialIDs.forEach((id) => {
            priceIDRequest.add(id);
          });
          priceIDRequest.add(snap.itemID);
        });
        userSettings.watchlist.forEach((snap) => {
          priceIDRequest.add(snap.typeID);
          snap.materials.forEach((mat) => {
            priceIDRequest.add(mat.typeID);
            mat.materials.forEach((cMat) => {
              priceIDRequest.add(cMat.typeID);
            });
          });
        });
        let itemPrices = getItemPrices([...priceIDRequest], userObject);
        promiseArray.push(itemPrices);

        updateLoadingText((prevObj) => ({
          ...prevObj,
          charDataComp: true,
          apiData: true,
        }));
        let apiJobsArray = [];

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
            assets
          ] = await Promise.all([
            CharacterSkills(userObject),
            IndustryJobs(userObject),
            MarketOrders(userObject),
            HistoricMarketOrders(userObject),
            BlueprintLibrary(userObject),
            WalletTransactions(userObject),
            WalletJournal(userObject),
            fullAssetsList(userObject)
          ]);

          userObject.apiSkills = skills;
          userObject.apiJobs = indJobs;
          apiJobsArray = apiJobsArray.concat(indJobs);
          userObject.apiOrders = orders;
          userObject.apiHistOrders = histOrders;
          userObject.apiBlueprints = blueprints;
          userObject.apiTransactions = transactions;
          userObject.apiJournal = journal;
          sessionStorage.setItem(`assets_${userObject.CharacterHash}`, JSON.stringify(assets))
        } else {
          userObject.apiSkills = [];
          userObject.apiJobs = [];
          userObject.apiOrders = [];
          userObject.apiHistOrders = [];
          userObject.apiBlueprints = [];
          userObject.apiTransactions = [];
          userObject.apiJournal = [];
          sessionStorage.setItem(`assets_${userObject.CharacterHash}`, JSON.stringify([]))
        }
        userArray.push(userObject);
        updateLoadingText((prevObj) => ({
          ...prevObj,
          apiDataComp: true,
        }));

        let failedRefresh = [];
        if (userSettings.settings.account.cloudAccounts) {
          for (let token of userSettings.refreshTokens) {
            let newUser = await RefreshTokens(token.rToken, false);
            if (newUser === "RefreshFail") {
              failedRefresh.push(token.CharacterHash);
            }
            if (token.rToken !== newUser.rToken) {
              token.rToken = newUser.rToken;
            }
            if (sStatus && newUser !== "RefreshFail") {
              const [
                skills,
                indJobs,
                orders,
                histOrders,
                blueprints,
                transactions,
                journal,
                assets
              ] = await Promise.all([
                CharacterSkills(newUser),
                IndustryJobs(newUser, userObject),
                MarketOrders(newUser),
                HistoricMarketOrders(newUser),
                BlueprintLibrary(newUser),
                WalletTransactions(newUser),
                WalletJournal(newUser),
                fullAssetsList(newUser)
              ]);

              newUser.apiSkills = skills;
              newUser.apiJobs = indJobs;
              newUser.apiJobs.forEach((i) => {
                apiJobsArray.push(i);
              });
              newUser.apiOrders = orders;
              newUser.apiHistOrders = histOrders;
              newUser.apiBlueprints = blueprints;
              newUser.apiTransactions = transactions;
              newUser.apiJournal = journal;
              sessionStorage.setItem(`assets_${newUser.CharacterHash}`, JSON.stringify(assets))
            } else if (!sStatus) {
              newUser.apiSkills = [];
              newUser.apiJobs = [];
              newUser.apiOrders = [];
              newUser.apiHistOrders = [];
              newUser.apiBlueprints = [];
              newUser.apiTransactions = [];
              newUser.apiJournal = [];
              sessionStorage.setItem(`assets_${newUser.CharacterHash}`, JSON.stringify([]))
            }
            if (newUser !== undefined) {
              userArray.push(newUser);
            }
          }
        } else {
          let rTokens = JSON.parse(
            localStorage.getItem(
              `${userObject.CharacterHash} AdditionalAccounts`
            )
          );
          if (rTokens !== null) {
            for (let token of rTokens) {
              let newUser = await RefreshTokens(token.rToken, false);
              console.log(newUser);
              if (newUser === "RefreshFail") {
                failedRefresh.push(token.CharacterHash);
              }
              if (token.rToken !== newUser.rToken) {
                token.rToken = newUser.rToken;
                localStorage.setItem(
                  `${userObject.CharacterHash} AdditionalAccounts`,
                  JSON.stringify(rTokens)
                );
              }
              if (sStatus && newUser !== "RefreshFail") {
                const [
                  skills,
                  indJobs,
                  orders,
                  histOrders,
                  blueprints,
                  transactions,
                  journal,
                  assets
                ] = await Promise.all([
                  CharacterSkills(newUser),
                  IndustryJobs(newUser, userObject),
                  MarketOrders(newUser),
                  HistoricMarketOrders(newUser),
                  BlueprintLibrary(newUser),
                  WalletTransactions(newUser),
                  WalletJournal(newUser),
                  fullAssetsList(newUser),
                ]);

                newUser.apiSkills = skills;
                newUser.apiJobs = indJobs;
                newUser.apiJobs.forEach((i) => {
                  apiJobsArray.push(i);
                });
                newUser.apiOrders = orders;
                newUser.apiHistOrders = histOrders;
                newUser.apiBlueprints = blueprints;
                newUser.apiTransactions = transactions;
                newUser.apiJournal = journal;
                sessionStorage.setItem(`assets_${newUser.CharacterHash}`, JSON.stringify(assets))
              } else if (!sStatus) {
                newUser.apiSkills = [];
                newUser.apiJobs = [];
                newUser.apiOrders = [];
                newUser.apiHistOrders = [];
                newUser.apiBlueprints = [];
                newUser.apiTransactions = [];
                newUser.apiJournal = [];
                sessionStorage.setItem(`assets_${newUser.CharacterHash}`, JSON.stringify([]))
              }
              if (newUser !== "RefreshFail") {
                userArray.push(newUser);
              }
            }
          }
        }
        if (failedRefresh.length > 0) {
          if (userObject.settings.account.cloudAccounts) {
            userArray[0].accountRefreshTokens =
              userArray[0].accountRefreshTokens.filter(
                (i) => !failedRefresh.includes(i.CharacterHash)
              );
          } else {
            let oldLS = JSON.parse(
              localStorage.getItem(
                `${userObject.CharacterHash} AdditionalAccounts`
              )
            );
            let newLS = oldLS.filter(
              (i) => !failedRefresh.includes(i.CharacterHash)
            );
            localStorage.setItem(
              `${userObject.CharacterHash} AdditionalAccounts`,
              JSON.stringify(newLS)
            );
          }
        }

        apiJobsArray.sort((a, b) => {
          if (a.product_name < b.product_name) {
            return -1;
          }
          if (a.product_name > b.product_name) {
            return 1;
          }
          return 0;
        });

        let locationIDS = new Set();
        let citadelStore = new Set();
        let newIDNamePromises = [];
        let newNameArray = [];

        for (let user of userArray) {
          let citadelIDs = new Set();
          user.apiJobs.forEach((job) => {
            if (job.facility_id.toString().length > 10) {
              if (!citadelStore.has(job.facility_id)) {
                citadelIDs.add(job.facility_id);
                citadelStore.add(job.facility_id);
              }
            } else {
              locationIDS.add(job.facility_id);
            }
          });
          user.apiOrders.forEach((order) => {
            if (order.location_id.toString().length > 10) {
              if (!citadelStore.has(order.location_id)) {
                citadelIDs.add(order.location_id);
                citadelStore.add(order.location_id);
              }
            } else {
              locationIDS.add(order.location_id);
            }
            locationIDS.add(order.region_id);
          });
          user.apiHistOrders.forEach((order) => {
            if (order.location_id.toString().length > 10) {
              if (!citadelStore.has(order.location_id)) {
                citadelIDs.add(order.location_id);
                citadelStore.add(order.location_id);
              }
            } else {
              locationIDS.add(order.location_id);
            }
            locationIDS.add(order.region_id);
          });
          if ([...citadelIDs].length > 0) {
            let tempCit = IDtoName([...citadelIDs], user);
            newIDNamePromises.push(tempCit);
          }
        }
        if ([...locationIDS].length > 0) {
          let tempLoc = IDtoName([...locationIDS], userObject);
          newIDNamePromises.push(tempLoc);
        }

        let returnLocations = await Promise.all(newIDNamePromises);

        returnLocations.forEach((group) => {
          newNameArray = newNameArray.concat(group);
        });

        let returnPromiseArray = await Promise.all(promiseArray);
        updateEveIDs(newNameArray);
        updateEvePrices(returnPromiseArray[0]);
        setJobStatus(userSettings.jobStatusArray);
        updateJobArray(userSettings.jobArraySnapshot);
        updateUsers(userArray);
        updateApiJobs(apiJobsArray);
        updateIsLoggedIn(true);
        updatePageLoad(false);
        logEvent(analytics, "userSignIn", {
          UID: userObject.accountID,
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
        navigate(returnState);
      }
      if (localStorage.getItem("AddAccount")) {
        const authCode = window.location.search.match(/code=(\S*)&/)[1];
        const userObject = await EveSSOTokens(authCode, false);
        localStorage.setItem("AdditionalUser", JSON.stringify(userObject));
        localStorage.setItem("AddAccountComplete", true);
        window.close();
      }
    }
    mainUserLoggin();
  }, []);

  return <LoadingPage />;
}

async function EveSSOTokens(authCode, accountType) {
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

    if (accountType) {
      const newUser = new MainUser(decodedToken, tokenJSON);
      newUser.ParentUser = accountType;
      localStorage.setItem("Auth", tokenJSON.refresh_token);
      return newUser;
    } else {
      const newUser = new SecondaryUser(decodedToken, tokenJSON);
      newUser.ParentUser = accountType;
      return newUser;
    }
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
    this.ParentUser = null;
    this.apiSkills = null;
    this.apiJobs = null;
    this.linkedJobs = [];
    this.linkedOrders = [];
    this.linkedTrans = [];
    this.apiOrders = null;
    this.apiHistOrders = null;
    this.apiBlueprints = null;
    this.watchlist = [];
    this.settings = null;
    this.accountRefreshTokens = [];
    this.refreshState = 1;
  }
}
class SecondaryUser {
  constructor(decodedToken, tokenJSON) {
    this.CharacterID = Number(decodedToken.sub.match(/\w*:\w*:(\d*)/)[1]);
    this.CharacterHash = decodedToken.owner;
    this.CharacterName = decodedToken.name;
    this.aToken = tokenJSON.access_token;
    this.aTokenEXP = Number(decodedToken.exp);
    this.rToken = tokenJSON.refresh_token;
    this.ParentUser = null;
    this.apiSkills = null;
    this.apiJobs = null;
    this.apiOrders = null;
    this.apiHistOrders = null;
    this.apiBlueprints = null;
    this.refreshState = 1;
  }
}
