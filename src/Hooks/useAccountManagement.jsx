import { useEveApi } from "./useEveApi";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth, signOut } from "firebase/auth";
import { functions, performance } from "../firebase";
import { useNavigate } from "react-router";
import { useContext, useMemo } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
  UserWatchlistContext,
} from "../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  ArchivedJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import {
  CorpEsiDataContext,
  EveIDsContext,
  PersonalESIDataContext,
} from "../Context/EveDataContext";
import { SnackBarDataContext } from "../Context/LayoutContext";
import {
  apiJobsDefault,
  jobArrayDefault,
  jobStatusDefault,
  usersDefault,
  eveIDsDefault,
  userJobSnapshotDefault,
} from "../Context/defaultValues";
import { httpsCallable } from "firebase/functions";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import searchData from "../RawData/searchIndex.json";
import { trace } from "firebase/performance";

export function useAccountManagement() {
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateUserWatchlist } = useContext(UserWatchlistContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const {
    updateEsiIndJobs,
    updateEsiSkills,
    updateEsiOrders,
    updateEsiHistOrders,
    updateEsiBlueprints,
    updateEsiJournal,
    updateEsiTransactions,
    updateEsiStandings,
  } = useContext(PersonalESIDataContext);
  const { updateCorpEsiIndJobs } = useContext(CorpEsiDataContext);
  const checkClaims = httpsCallable(functions, "userClaims-updateCorpIDs");
  const auth = getAuth();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser), [users];
  });

  const {
    characterData,
    CharacterSkills,
    corpIndustryJobs,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletJournal,
    WalletTransactions,
    fullAssetsList,
    IDtoName,
    standingsList,
    serverStatus,
  } = useEveApi();
  const analytics = getAnalytics();
  const navigate = useNavigate();

  const buildMainUser = (userObject, userSettings) => {
    userObject.accountID = userSettings.accountID;
    userObject.linkedJobs = new Set(userSettings.linkedJobs);
    userObject.linkedTrans = new Set(userSettings.linkedTrans);
    userObject.linkedOrders = new Set(userSettings.linkedOrders);
    userObject.settings = userSettings.settings;
    userObject.accountRefreshTokens = userSettings.refreshTokens;

    return userObject;
  };

  const characterAPICall = async (userObject) => {
    const t = trace(performance, "CharacterESICalls");
    t.start();
    const [
      skills,
      indJobs,
      orders,
      histOrders,
      blueprints,
      transactions,
      journal,
      assets,
      standings,
      corpIndJobs,
    ] = await Promise.all([
      CharacterSkills(userObject),
      IndustryJobs(userObject),
      MarketOrders(userObject),
      HistoricMarketOrders(userObject),
      BlueprintLibrary(userObject),
      WalletTransactions(userObject),
      WalletJournal(userObject),
      fullAssetsList(userObject),
      standingsList(userObject),
      corpIndustryJobs(userObject),
    ]);
    t.stop();
    return {
      owner: userObject.CharacterHash,
      esiSkills: skills,
      esiJobs: indJobs,
      esiOrders: orders,
      esiHistOrders: histOrders,
      esiBlueprints: blueprints,
      esiJournal: journal,
      esiTransactions: transactions,
      esiAssets: assets,
      esiStandings: standings,
      esiCorpJobs: corpIndJobs,
    };
  };

  const getLocationNames = async (users, mainUser, esiObjectArray) => {
    let locationIDS = new Set();
    let citadelStore = new Set();
    let newIDNamePromises = [];
    let newNameArray = [];

    for (let user of users) {
      let data = esiObjectArray.find((i) => i.owner === user.CharacterHash);
      if (data === undefined) {
        continue;
      }
      let citadelIDs = new Set();

      if (user.ParentUser) {
        if (user.settings.editJob.defaultAssetLocation.toString().length > 10) {
          if (!citadelStore.has(user.settings.editJob.defaultAssetLocation)) {
            citadelIDs.add(user.settings.editJob.defaultAssetLocation);
            citadelStore.add(user.settings.editJob.defaultAssetLocation);
          }
        } else {
          locationIDS.add(user.settings.editJob.defaultAssetLocation);
        }
      }
      data.esiJobs.forEach((job) => {
        if (job.facility_id.toString().length > 10) {
          if (!citadelStore.has(job.facility_id)) {
            citadelIDs.add(job.facility_id);
            citadelStore.add(job.facility_id);
          }
        } else {
          locationIDS.add(job.facility_id);
        }
      });
      data.esiOrders.forEach((order) => {
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
      data.esiHistOrders.forEach((order) => {
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
        newIDNamePromises.push(IDtoName([...citadelIDs], user));
      }
    }
    if ([...locationIDS].length > 0) {
      newIDNamePromises.push(IDtoName([...locationIDS], mainUser));
    }

    let returnLocations = await Promise.all(newIDNamePromises);

    returnLocations.forEach((group) => {
      newNameArray = newNameArray.concat(group);
    });

    return newNameArray;
  };

  const logUserOut = () => {
    logEvent(analytics, "userLogOut", {
      UID: parentUser.accountID,
    });
    firebaseListeners.forEach((unsub) => {
      unsub();
    });
    updateFirebaseListeners([]);
    updateIsLoggedIn(false);
    updateUsers(usersDefault);
    updateUserJobSnapshot(userJobSnapshotDefault);
    updateJobArray(jobArrayDefault);
    updateEveIDs(eveIDsDefault);
    setJobStatus(jobStatusDefault);
    updateActiveJob({});
    updateArchivedJobs([]);
    updateApiJobs(apiJobsDefault);
    updateUserWatchlist({ groups: [], items: [] });
    sessionStorage.clear();
    localStorage.removeItem("Auth");
    signOut(auth);
    navigate("/");
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: "Logged Out",
      severity: "info",
      autoHideDuration: 3000,
    }));
  };

  const failedUserRefresh = (failedRefreshSet, userObject) => {
    if (failedRefreshSet.size === 0) {
      return;
    }
    if (userObject.settings.account.cloudAccounts) {
      userObject.accountRefreshTokens = userObject.accountRefreshTokens.filter(
        (i) => !failedRefreshSet.has(i.CharacterHash)
      );
      return;
    }
    let oldLS = JSON.parse(
      localStorage.getItem(`${refreshedUser.CharacterHash} AdditionalAccounts`)
    );
    let newLS = oldLS.filter((i) => !failedRefreshSet.has(i.CharacterHash));
    localStorage.setItem(
      `${refreshedUser.CharacterHash} AdditionalAccounts`,
      JSON.stringify(newLS)
    );
    return;
  };

  const tidyLinkedData = (
    newLinkedJobs,
    newLinkedOrders,
    newLinkedTrans,
    userObject,
    userArray,
    esiObjectArray
  ) => {
    let allJobIDs = new Set();
    let allOrderIDs = new Set();
    let allTransIDs = new Set();

    for (let user of userArray) {
      let data = esiObjectArray.find((i) => i.owner === user.CharacterHash);
      if (data === undefined) {
        continue;
      }
      data.esiJobs.forEach((job) => {
        allJobIDs.add(job.job_id);
      });

      data.esiOrders.forEach((order) => {
        allOrderIDs.add(order.order_id);
      });

      data.esiHistOrders.forEach((order) => {
        allOrderIDs.add(order.order_id);
      });

      data.esiTransactions.forEach((trans) => {
        allTransIDs.add(trans.transaction_id);
      });
    }

    newLinkedJobs = newLinkedJobs.filter((id) => allJobIDs.has(id));
    newLinkedOrders = newLinkedOrders.filter((id) => allOrderIDs.has(id));
    newLinkedTrans = newLinkedTrans.filter((id) => allTransIDs.has(id));

    userObject.linkedJobs = new Set(newLinkedJobs);
    userObject.linkedOrders = new Set(newLinkedOrders);
    userObject.linkedTrans = new Set(newLinkedTrans);
  };

  const checkUserClaims = async (newUserArray) => {
    let triggerClaimUpdate = false;
    let token = await auth.currentUser.getIdTokenResult();
    let dataArray = [];
    let corpIDs = new Set();

    for (let user of newUserArray) {
      if (
        !token.claims.hasOwnProperty("corporations") ||
        !token.claims.corporations.includes(user.corporation_id)
      ) {
        triggerClaimUpdate = true;
      }
      dataArray.push({
        authToken: `${user.aToken}`,
      });
      corpIDs.add(user.corporation_id);
    }
    if (
      !triggerClaimUpdate &&
      corpIDs.size !== token.claims.corporations.length
    ) {
      triggerClaimUpdate = true;
    }

    if (triggerClaimUpdate) {
      await checkClaims(dataArray);
      await auth.currentUser.getIdToken(true);
      return;
    }
    return;
  };

  const buildCloudAccountData = async (
    refreshTokens,
    userArray,
    esiObjectArray
  ) => {
    for (let token of refreshTokens) {
      let newUser = await RefreshTokens(token.rToken, false);
      if (newUser === "RefreshFail") {
        continue;
      }
      await getCharacterInfo(newUser);
      let esiObject = await characterAPICall(newUser);
      userArray.push(newUser);
      esiObjectArray.push(esiObject);
    }
  };

  const buildLocalAccountData = async (userArray, esiObjectArray) => {
    let parent = userArray.find((i) => i.ParentUser);
    let rTokens = JSON.parse(
      localStorage.getItem(`${parent.CharacterHash} AdditionalAccounts`)
    );

    if (rTokens === null) {
      return userArray;
    }
    for (let token of rTokens) {
      let newUser = await RefreshTokens(token.rToken, false);
      if (newUser === "RefreshFail") {
        continue;
      }
      await getCharacterInfo(newUser);
      let esiObject = await characterAPICall(newUser);

      esiObjectArray.push(esiObject);
      userArray.push(newUser);
    }
  };

  const updateCloudRefreshTokens = (refreshTokens, userArray) => {
    for (let user of userArray) {
      if (user.ParentUser) {
        continue;
      }
      let token = refreshTokens.find(
        (i) => i.CharacterHash === user.CharacterHash
      );
      if (token === undefined) {
        continue;
      }
      if (user.rToken !== token.rToken) {
        token.rToken = user.rToken;
      }
    }
    refreshTokens = refreshTokens.filter((i) =>
      userArray.some(
        (u) => u.CharacterHash === i.CharacterHash && !u.ParentUser
      )
    );
    return refreshTokens;
  };

  const updateLocalRefreshTokens = (userArray) => {
    let tokenArray = [];
    let parent = userArray.find((i) => i.ParentUser);
    for (let user of userArray) {
      if (user.ParentUser) {
        continue;
      }
      tokenArray.push({
        CharacterHash: user.CharacterHash,
        rToken: user.rToken,
      });
    }
    localStorage.setItem(
      `${parent.CharacterHash} AdditionalAccounts`,
      JSON.stringify(tokenArray)
    );
  };

  const buildApiArray = (userArray, esiObjectArray) => {
    let newApiArray = [];
    for (let user of userArray) {
      let data = esiObjectArray.find((i) => i.owner === user.CharacterHash);
      if (data === undefined) {
        continue;
      }
      newApiArray = newApiArray.concat(data.esiJobs);
      newApiArray = newApiArray.concat(data.esiCorpJobs);
    }

    newApiArray.sort((a, b) => {
      let aName = searchData.find(
        (i) =>
          i.itemID === a.product_type_id ||
          i.blueprintID === a.blueprint_type_id
      );
      let bName = searchData.find(
        (i) =>
          i.itemID === b.product_type_id ||
          i.blueprintID === b.blueprint_type_id
      );
      if (aName === undefined || bName === undefined) {
        return -1;
      }
      if (aName.name < bName.name) {
        return -1;
      }
      if (aName.name > bName.name) {
        return 1;
      }
      return 0;
    });
    return newApiArray;
  };

  const storeESIData = async (esiObjectArray) => {
    for (let esiUser of esiObjectArray) {
      sessionStorage.setItem(
        `esiSkills_${esiUser.owner}`,
        JSON.stringify(esiUser.esiSkills)
      );
      sessionStorage.setItem(
        `esiJobs_${esiUser.owner}`,
        JSON.stringify(esiUser.esiJobs)
      );
      sessionStorage.setItem(
        `esiOrders_${esiUser.owner}`,
        JSON.stringify(esiUser.esiOrders)
      );
      sessionStorage.setItem(
        `esiHistOrders_${esiUser.owner}`,
        JSON.stringify(esiUser.esiHistOrders)
      );
      sessionStorage.setItem(
        `esiBlueprints_${esiUser.owner}`,
        JSON.stringify(esiUser.esiBlueprints)
      );
      sessionStorage.setItem(
        `esiTransactions_${esiUser.owner}`,
        JSON.stringify(esiUser.esiTransactions)
      );
      sessionStorage.setItem(
        `esiJournal_${esiUser.owner}`,
        JSON.stringify(esiUser.esiJournal)
      );
      sessionStorage.setItem(
        `assets_${esiUser.owner}`,
        JSON.stringify(esiUser.esiAssets)
      );
      sessionStorage.setItem(
        `esiStandings_${esiUser.owner}`,
        JSON.stringify(esiUser.esiStandings)
      );
      sessionStorage.setItem(
        `esiCorpJobs_${esiUser.owner}`,
        JSON.stringify(esiUser.esiCorpJobs)
      );
    }
  };

  const getCharacterInfo = async (userObj) => {
    const charData = await characterData(userObj);
    userObj.corporation_id = charData.corporation_id;
  };

  return {
    buildApiArray,
    buildCloudAccountData,
    buildLocalAccountData,
    buildMainUser,
    characterAPICall,
    checkUserClaims,
    failedUserRefresh,
    getCharacterInfo,
    getLocationNames,
    logUserOut,
    storeESIData,
    tidyLinkedData,
    updateCloudRefreshTokens,
    updateLocalRefreshTokens,
  };
}
