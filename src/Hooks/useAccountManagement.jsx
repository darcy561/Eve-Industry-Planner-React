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
import {
  SnackBarDataContext,
  UserLoginUIContext,
} from "../Context/LayoutContext";
import {
  apiJobsDefault,
  jobArrayDefault,
  jobStatusDefault,
  usersDefault,
  eveIDsDefault,
  userJobSnapshotDefault,
  defaultEsiJobs,
  defaultEsiSkills,
  defaultEsiOrders,
  defaultEsiHistOrders,
  defaultEsiBlueprints,
  defaultEsiJournal,
  defaultEsiTransactions,
  defaultEsiStandings,
} from "../Context/defaultValues";
import { httpsCallable } from "firebase/functions";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import searchData from "../RawData/searchIndex.json";
import { trace } from "firebase/performance";
import { fetchSystemIndexes } from "./FetchDataHooks/fetchSystemIndexes";

export function useAccountManagement() {
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateGroupArray, updateJobArray } = useContext(JobArrayContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateActiveJob, updateActiveGroup } = useContext(ActiveJobContext);
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateUserWatchlist } = useContext(UserWatchlistContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const {
    esiIndJobs,
    updateEsiIndJobs,
    esiSkills,
    updateEsiSkills,
    esiOrders,
    updateEsiOrders,
    esiHistOrders,
    updateEsiHistOrders,
    esiBlueprints,
    updateEsiBlueprints,
    esiJournal,
    updateEsiJournal,
    esiTransactions,
    updateEsiTransactions,
    esiStandings,
    updateEsiStandings,
  } = useContext(PersonalESIDataContext);
  const {
    corpEsiIndJobs,
    updateCorpEsiIndJobs,
    corpEsiOrders,
    updateCorpEsiOrders,
    corpEsiHistOrders,
    updateCorpEsiHistOrders,
    corpEsiBlueprints,
    updateCorpEsiBlueprints,
    corpEsiJournal,
    updateCorpEsiJournal,
    corpEsiTransactions,
    updateCorpEsiTransactions,
    corpEsiData,
    updateCorpEsiData,
  } = useContext(CorpEsiDataContext);
  const { updateUserUIData, updateLoginInProgressComplete } =
    useContext(UserLoginUIContext);

  const checkClaims = httpsCallable(functions, "userClaims-updateCorpIDs");
  const auth = getAuth();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const {
    fetchCharacterData,
    fetchCharacterSkills,
    fetchCorpAssets,
    fetchCorpIndustryJobs,
    fetchCorpMarketOrdersJobs,
    fetchCorpHistMarketOrders,
    fetchCorpBlueprintLibrary,
    fetchCorpDivisions,
    fetchCorpPublicInfo,
    fetchCorpJournal,
    fetchCorpTransactions,
    fetchCharacterIndustryJobs,
    fetchCharacterMarketOrders,
    fetchCharacterHistMarketOrders,
    fetchCharacterBlueprints,
    fetchCharacterJournal,
    fetchCharacterTransactions,
    fetchCharacterAssets,
    fetchUniverseNames,
    fetchCharacterStandings,
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

    const apiFunctions = {
      esiSkills: fetchCharacterSkills,
      esiJobs: fetchCharacterIndustryJobs,
      esiOrders: fetchCharacterMarketOrders,
      esiHistOrders: fetchCharacterHistMarketOrders,
      esiBlueprints: fetchCharacterBlueprints,
      esiTransactions: fetchCharacterTransactions,
      esiJournal: fetchCharacterJournal,
      esiAssets: fetchCharacterAssets,
      esiStandings: fetchCharacterStandings,
      esiCorpJobs: fetchCorpIndustryJobs,
      esiCorpMOrders: fetchCorpMarketOrdersJobs,
      esiCorpHistMOrders: fetchCorpHistMarketOrders,
      esiCorpBlueprints: fetchCorpBlueprintLibrary,
      esiCorpJournal: fetchCorpJournal,
      esiCorpTransactions: fetchCorpTransactions,
      esiCorpDivisions: fetchCorpDivisions,
      esiCorpPublicInfo: fetchCorpPublicInfo,
      esiCorpAssets: fetchCorpAssets,
    };

    const apiResults = await Promise.all(
      Object.values(apiFunctions).map((apiFunction) => apiFunction(userObject))
    );

    t.stop();

    const resultObject = {};

    Object.keys(apiFunctions).forEach((key, index) => {
      resultObject[key] = apiResults[index];
    });

    resultObject.owner = userObject.CharacterHash;

    return resultObject;
  };

  const getLocationNames = async (users, mainUser, esiObjectArray) => {
    let locationIDS = new Set();
    let citadelStore = new Set();
    let existingLocations = new Set();
    let newIDNamePromises = [];

    for (let user of users) {
      let citadelIDs = new Set();
      const addLocation = (id) => {
        if (!existingLocations.has(id)) {
          locationIDS.add(id);
        }
      };

      const addCitadel = (id) => {
        if (!existingLocations.has(id) && !citadelIDs.has(id)) {
          citadelIDs.add(id);
        }
      };
      let data = esiObjectArray.find((i) => i.owner === user.CharacterHash);
      if (!data) {
        continue;
      }

      if (user.ParentUser) {
        if (user.settings.editJob.defaultAssetLocation.toString().length > 10) {
          if (!citadelStore.has(user.settings.editJob.defaultAssetLocation)) {
            citadelStore.add(user.settings.editJob.defaultAssetLocation);
            addCitadel(user.settings.editJob.defaultAssetLocation);
          }
        } else {
          addLocation(user.settings.editJob.defaultAssetLocation);
        }
      }

      [...data.esiJobs, ...data.esiCorpJobs].forEach((job) => {
        if (job.facility_id.toString().length > 10) {
          if (!citadelStore.has(job.facility_id)) {
            citadelStore.add(job.facility_id);
            addCitadel(job.facility_id);
          }
        } else {
          addLocation(job.facility_id);
        }
      });

      [
        ...data.esiOrders,
        ...data.esiHistOrders,
        ...data.esiCorpMOrders,
        ...data.esiCorpHistMOrders,
      ].forEach((order) => {
        if (order.location_id.toString().length > 10) {
          if (!citadelStore.has(order.location_id)) {
            citadelStore.add(order.location_id);
            addCitadel(order.location_id);
          }
        } else {
          addLocation(order.location_id);
        }
        addLocation(order.region_id);
      });

      const corporationOfficeLocationObjects = data.esiCorpAssets.filter(
        (i) => i.location_flag === "OfficeFolder"
      );
      corporationOfficeLocationObjects.forEach(({ location_id }) => {
        if (location_id.toString().length > 10) {
          if (!citadelStore.has(location_id)) {
            citadelStore.add(location_id);
            addCitadel(location_id);
          }
        } else {
          addLocation(location_id);
        }
      });

      if ([...citadelIDs].length > 0) {
        newIDNamePromises.push(fetchUniverseNames([...citadelIDs], user));
      }
    }
    if ([...locationIDS].length > 0) {
      newIDNamePromises.push(fetchUniverseNames([...locationIDS], mainUser));
    }

    const returnLocations = await Promise.all(newIDNamePromises);

    return returnLocations.flat();
  };

  const logUserOut = () => {
    logEvent(analytics, "userLogOut", {
      UID: parentUser.accountID,
    });
    firebaseListeners.forEach((unsub) => {
      unsub();
    });
    updateLoginInProgressComplete(false);
    updateFirebaseListeners([]);
    updateIsLoggedIn(false);
    updateUsers(usersDefault);
    updateUserJobSnapshot(userJobSnapshotDefault);
    updateJobArray(jobArrayDefault);
    updateEveIDs(eveIDsDefault);
    setJobStatus(jobStatusDefault);
    updateActiveJob({});
    updateArchivedJobs([]);
    updateGroupArray([]);
    updateActiveGroup(null);
    updateApiJobs(apiJobsDefault);
    updateUserWatchlist({ groups: [], items: [] });

    updateEsiIndJobs(defaultEsiJobs);
    updateEsiSkills(defaultEsiSkills);
    updateEsiOrders(defaultEsiOrders);
    updateEsiHistOrders(defaultEsiHistOrders);
    updateEsiBlueprints(defaultEsiBlueprints);
    updateEsiJournal(defaultEsiJournal);
    updateEsiTransactions(defaultEsiTransactions);
    updateEsiStandings(defaultEsiStandings);

    updateCorpEsiIndJobs(new Map());
    updateCorpEsiOrders([]);
    updateCorpEsiHistOrders([]);
    updateCorpEsiBlueprints([]);
    updateCorpEsiJournal([]);
    updateCorpEsiTransactions([]);
    updateCorpEsiData(new Map());

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
    if (failedRefreshSet.size === 0) return;

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
    const allJobIDs = new Set(
      userArray.flatMap((user) => {
        const data = esiObjectArray.find(
          (obj) => obj.owner === user.CharacterHash
        );
        if (!data) return [];
        return [...data.esiJobs, ...data.esiCorpJobs].map((job) => job.job_id);
      })
    );

    const allOrderIDs = new Set(
      userArray.flatMap((user) => {
        const data = esiObjectArray.find(
          (obj) => obj.owner === user.CharacterHash
        );
        if (!data) return [];
        return [
          ...data.esiOrders,
          ...data.esiHistOrders,
          ...data.esiCorpMOrders,
          ...data.esiCorpHistMOrders,
        ].map((order) => order.order_id);
      })
    );

    const allTransIDs = new Set(
      userArray.flatMap((user) => {
        const data = esiObjectArray.find(
          (obj) => obj.owner === user.CharacterHash
        );
        if (!data) return [];
        return [...data.esiTransactions, ...data.esiCorpTransactions].map(
          (trans) => trans.transaction_id
        );
      })
    );

    newLinkedJobs = newLinkedJobs.filter((id) => allJobIDs.has(id));
    newLinkedOrders = newLinkedOrders.filter((id) => allOrderIDs.has(id));
    newLinkedTrans = newLinkedTrans.filter((id) => allTransIDs.has(id));

    Object.assign(userObject, {
      linkedJobs: new Set(newLinkedJobs),
      linkedOrders: new Set(newLinkedOrders),
      linkedTrans: new Set(newLinkedTrans),
    });
  };

  const checkUserClaims = async (newUserArray) => {
    let triggerClaimUpdate = false;
    const token = await auth.currentUser.getIdTokenResult();
    const dataArray = [];
    const corpIDs = new Set();

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
      if (newUser === "RefreshFail") continue;

      await getCharacterInfo(newUser);
      let esiObject = await characterAPICall(newUser);
      updateUserUIData((prev) => ({
        ...prev,
        userArray: prev.userArray.concat([
          {
            CharacterID: newUser.CharacterID,
            CharacterName: newUser.CharacterName,
          },
        ]),
      }));
      userArray.push(newUser);
      esiObjectArray.push(esiObject);
    }
  };

  const buildLocalAccountData = async (userArray, esiObjectArray) => {
    const parent = userArray.find((i) => i.ParentUser);
    const rTokens = JSON.parse(
      localStorage.getItem(`${parent.CharacterHash} AdditionalAccounts`)
    );

    if (!rTokens) {
      return userArray;
    }
    for (let token of rTokens) {
      let newUser = await RefreshTokens(token.rToken, false);
      if (newUser === "RefreshFail") continue;

      await getCharacterInfo(newUser);
      let esiObject = await characterAPICall(newUser);
      updateUserUIData((prev) => ({
        ...prev,
        userArray: prev.userArray.concat([
          {
            CharacterID: newUser.CharacterID,
            CharacterName: newUser.CharacterName,
          },
        ]),
      }));
      esiObjectArray.push(esiObject);
      userArray.push(newUser);
    }
  };

  const updateCloudRefreshTokens = (refreshTokens, userArray) => {
    for (let user of userArray) {
      if (user.ParentUser) continue;

      let token = refreshTokens.find(
        (i) => i.CharacterHash === user.CharacterHash
      );
      if (!token) continue;

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
    const tokenArray = [];
    const parent = userArray.find((i) => i.ParentUser);
    for (let user of userArray) {
      if (user.ParentUser) continue;

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
    const includedIDs = new Set();
    for (let user of userArray) {
      let data = esiObjectArray.find((i) => i.owner === user.CharacterHash);
      if (!data) continue;

      data.esiCorpJobs.forEach((job) => {
        if (includedIDs.has(job.job_id)) return;
        includedIDs.add(job.job_id);
        newApiArray.push(job);
      });
      data.esiJobs.forEach((job) => {
        if (includedIDs.has(job.job_id)) return;
        includedIDs.add(job.job_id);
        newApiArray.push(job);
      });

      // newApiArray = newApiArray.concat(data.esiJobs, data.esiCorpJobs);
    }

    newApiArray.sort((a, b) => {
      const getItemName = (itemId, blueprintId) => {
        const item = searchData.find(
          (i) => i.itemID === itemId || i.blueprintID === blueprintId
        );
        return item ? item.name : "";
      };

      const aName = getItemName(a.product_type_id, a.blueprint_type_id);
      const bName = getItemName(b.product_type_id, b.blueprint_type_id);

      return aName.localeCompare(bName);
    });

    return newApiArray;
  };

  const updateApiArray = (
    chosenApiArray,
    chosentUsersArray,
    esiObjectArray
  ) => {
    const characterIDToRemove = new Set();

    for (let entry of esiObjectArray) {
      let id = chosentUsersArray.find(
        (i) => i.CharacterHash === entry.owner
      ).CharacterID;
      characterIDToRemove.add(id);
    }

    if (characterIDToRemove.szie > 0) {
      chosenApiArray = chosenApiArray.filter(
        (i) => !characterIDToRemove.has(i.installer_id)
      );
    }

    for (let entry of esiObjectArray) {
      chosenApiArray = chosenApiArray.concat(entry.esiJobs, entry.esiCorpJobs);
    }
    chosenApiArray.sort((a, b) => {
      const getItemName = (itemId, blueprintId) => {
        const item = searchData.find(
          (i) => i.itemID === itemId || i.blueprintID === blueprintId
        );
        return item ? item.name : "";
      };

      const aName = getItemName(a.product_type_id, a.blueprint_type_id);
      const bName = getItemName(b.product_type_id, b.blueprint_type_id);

      return aName.localeCompare(bName);
    });

    return chosenApiArray;
  };

  const storeESIData = async (esiObjectArray) => {
    let skills = [];
    let jobs = [];
    let orders = [];
    let histOrders = [];
    let blueprints = [];
    let transactions = [];
    let journal = [];
    let standings = [];
    let corpJobs = new Map();
    let corpOrders = [];
    let corpHistMOrders = [];
    let corpBlueprints = [];
    let corpJournal = [];
    let corpTransactions = [];

    for (let esiUser of esiObjectArray) {
      skills.push({
        user: esiUser.owner,
        data: esiUser.esiSkills,
      });
      jobs.push({
        user: esiUser.owner,
        data: esiUser.esiJobs,
      });
      orders.push({
        user: esiUser.owner,
        data: esiUser.esiOrders,
      });
      histOrders.push({
        user: esiUser.owner,
        data: esiUser.esiHistOrders,
      });
      blueprints.push({
        user: esiUser.owner,
        data: esiUser.esiBlueprints,
      });
      transactions.push({
        user: esiUser.owner,
        data: esiUser.esiTransactions,
      });
      journal.push({
        user: esiUser.owner,
        data: esiUser.esiJournal,
      });
      standings.push({
        user: esiUser.owner,
        data: esiUser.esiStandings,
      });
      sessionStorage.setItem(
        `assets_${esiUser.owner}`,
        JSON.stringify(esiUser.esiAssets)
      );
      corpJobs.set(esiUser.owner, esiUser.esiCorpJobs);
      corpOrders.push({
        user: esiUser.owner,
        data: esiUser.esiOrders,
      });
      corpHistMOrders.push({
        user: esiUser.owner,
        data: esiUser.esiCorpHistMOrders,
      });
      corpBlueprints.push({
        user: esiUser.owner,
        data: esiUser.esiCorpBlueprints,
      });
      corpJournal.push({
        user: esiUser.owner,
        data: esiUser.esiCorpJournal,
      });
      corpTransactions.push({
        user: esiUser.owner,
        data: esiUser.esiCorpTransactions,
      });
    }
    updateEsiIndJobs(jobs);
    updateEsiSkills(skills);
    updateEsiOrders(orders);
    updateEsiHistOrders(histOrders);
    updateEsiBlueprints(blueprints);
    updateEsiJournal(journal);
    updateEsiTransactions(transactions);
    updateEsiStandings(standings);
    updateCorpEsiIndJobs(corpJobs);
    updateCorpEsiOrders(corpOrders);
    updateCorpEsiHistOrders(corpHistMOrders);
    updateCorpEsiBlueprints(corpBlueprints);
    updateCorpEsiJournal(corpJournal);
    updateCorpEsiTransactions(corpTransactions);
  };

  const updateUserEsiData = (esiObjectArray) => {
    let usersToUpdate = new Set();
    let newEsiIndJobs = [...esiIndJobs];
    let newEsiSkills = [...esiSkills];
    let newEsiOrders = [...esiOrders];
    let newEsiHistOrders = [...esiHistOrders];
    let newEsiBlueprints = [...esiBlueprints];
    let newEsiJournal = [...esiJournal];
    let newEsiTransactions = [...esiTransactions];
    let newEsiStandings = [...esiStandings];
    let newCorpEsiOrders = [corpEsiOrders];
    let newCorpEsiHistMOrders = [...corpEsiHistOrders];
    let newCorpEsiBlueprints = [...corpEsiBlueprints];
    let newCorpEsiJournal = [...corpEsiJournal];
    let newCorpESiTransactions = [...corpEsiTransactions];

    esiObjectArray.forEach((entry) => {
      usersToUpdate.add(entry.user);
    });

    newEsiIndJobs = newEsiIndJobs.filter((i) => !usersToUpdate.has(i.user));
    newEsiSkills = newEsiSkills.filter((i) => !usersToUpdate.has(i.user));
    newEsiOrders = newEsiOrders.filter((i) => !usersToUpdate.has(i.user));
    newEsiHistOrders = newEsiHistOrders.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newEsiBlueprints = newEsiBlueprints.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newEsiJournal = newEsiJournal.filter((i) => !usersToUpdate.has(i.user));
    newEsiTransactions = newEsiTransactions.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newEsiStandings = newEsiStandings.filter((i) => !usersToUpdate.has(i.user));
    const newCorpEsiIndJobs = new Map(
      [...corpEsiIndJobs.entries()].filter(([key]) => !usersToUpdate.has(key))
    );
    newCorpEsiOrders = newCorpEsiOrders.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newCorpEsiHistMOrders = newCorpEsiHistMOrders.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newCorpEsiBlueprints = newCorpEsiBlueprints.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newCorpEsiJournal = newCorpEsiJournal.filter(
      (i) => !usersToUpdate.has(i.user)
    );
    newCorpESiTransactions = newCorpESiTransactions.filter(
      (i) => !usersToUpdate.has(i.user)
    );

    for (let esiUser of esiObjectArray) {
      newEsiOrders.push({
        user: esiUser.owner,
        data: esiUser.esiJobs,
      });
      newEsiSkills.push({
        user: esiUser.owner,
        data: esiUser.esiSkills,
      });
      newEsiOrders.push({
        user: esiUser.owner,
        data: esiUser.esiOrders,
      });
      newEsiHistOrders.push({
        user: esiUser.owner,
        data: esiUser.esiHistOrders,
      });
      newEsiBlueprints.push({
        user: esiUser.owner,
        data: esiUser.esiBlueprints,
      });
      newEsiTransactions.push({
        user: esiUser.owner,
        data: esiUser.esiTransactions,
      });
      newEsiJournal.push({
        user: esiUser.owner,
        data: esiUser.esiJournal,
      });
      newEsiStandings.push({
        user: esiUser.owner,
        data: esiUser.esiStandings,
      });
      sessionStorage.setItem(
        `assets_${esiUser.owner}`,
        JSON.stringify(esiUser.esiAssets)
      );
      newCorpEsiIndJobs.set(esiUser.owner, esiUser.esiCorpJobs);
      newCorpEsiOrders.push({
        user: esiUser.owner,
        data: esiUser.esiOrders,
      });
      newCorpEsiHistMOrders.push({
        user: esiUser.owner,
        data: esiUser.esiCorpHistMOrders,
      });
      newCorpEsiBlueprints.push({
        user: esiUser.owner,
        data: esiUser.esiBlueprints,
      });
      newCorpEsiJournal.push({
        user: esiUser.owner,
        data: esiUser.esiJournal,
      });
      newCorpESiTransactions.push({
        user: esiUser.owner,
        data: esiUser.esiTransactions,
      });
    }

    updateEsiIndJobs(newEsiIndJobs);
    updateEsiSkills(newEsiSkills);
    updateEsiOrders(newEsiOrders);
    updateEsiHistOrders(newEsiHistOrders);
    updateEsiBlueprints(newEsiBlueprints);
    updateEsiJournal(newEsiJournal);
    updateEsiTransactions(newEsiTransactions);
    updateEsiStandings(newEsiStandings);
    updateCorpEsiIndJobs(newCorpEsiIndJobs);
    updateCorpEsiOrders(newCorpEsiOrders);
    updateCorpEsiHistOrders(newCorpEsiHistMOrders);
    updateCorpEsiBlueprints(newCorpEsiBlueprints);
    updateCorpEsiJournal(newCorpEsiJournal);
    updateCorpEsiTransactions(newCorpESiTransactions);
  };

  const removeUserEsiData = (userHash) => {
    let newEsiIndJobs = [...esiIndJobs];
    let newEsiSkills = [...esiSkills];
    let newEsiOrders = [...esiOrders];
    let newEsiHistOrders = [...esiHistOrders];
    let newEsiBlueprints = [...esiBlueprints];
    let newEsiJournal = [...esiJournal];
    let newEsiTransactions = [...esiTransactions];
    let newEsiStandings = [...esiStandings];
    let newCorpEsiOrders = [...corpEsiOrders];
    let newCorpEsiHistMOrders = [...corpEsiHistOrders];
    let newCorpEsiBlueprints = [...corpEsiBlueprints];
    let newCorpEsiJournal = [...corpEsiJournal];
    let newCorpESiTransactions = [...corpEsiTransactions];

    newEsiIndJobs = newEsiIndJobs.filter((i) => i.user !== userHash);
    newEsiSkills = newEsiSkills.filter((i) => i.user !== userHash);
    newEsiOrders = newEsiOrders.filter((i) => i.user !== userHash);
    newEsiHistOrders = newEsiHistOrders.filter((i) => i.user !== userHash);
    newEsiBlueprints = newEsiBlueprints.filter((i) => i.user !== userHash);
    newEsiJournal = newEsiJournal.filter((i) => i.user !== userHash);
    newEsiTransactions = newEsiTransactions.filter((i) => i.user !== userHash);
    newEsiStandings = newEsiStandings.filter((i) => i.user !== userHash);
    const newCorpEsiIndJobs = new Map(
      [...corpEsiIndJobs].filter(([key]) => key !== userHash)
    );
    newCorpEsiOrders = newCorpEsiOrders.filter((i) => i.user !== userHash);
    newCorpEsiHistMOrders = newCorpEsiHistMOrders.filter(
      (i) => i.user !== userHash
    );
    newCorpEsiBlueprints = newCorpEsiBlueprints.filter(
      (i) => i.user !== userHash
    );
    newCorpEsiJournal = newCorpEsiJournal.filter((i) => i.user !== userHash);
    newCorpESiTransactions = newCorpESiTransactions.filter(
      (i) => i.user !== userHash
    );

    sessionStorage.removeItem(`assets_${userHash}`);

    updateEsiIndJobs(newEsiIndJobs);
    updateEsiSkills(newEsiSkills);
    updateEsiOrders(newEsiOrders);
    updateEsiHistOrders(newEsiHistOrders);
    updateEsiBlueprints(newEsiBlueprints);
    updateEsiJournal(newEsiJournal);
    updateEsiTransactions(newEsiTransactions);
    updateEsiStandings(newEsiStandings);
    updateCorpEsiIndJobs(newCorpEsiIndJobs);
    updateCorpEsiOrders(newCorpEsiOrders);
    updateCorpEsiHistOrders(newCorpEsiHistMOrders);
    updateCorpEsiBlueprints(newCorpEsiBlueprints);
    updateCorpEsiJournal(newCorpEsiJournal);
    updateCorpEsiTransactions(newCorpESiTransactions);
  };

  const getCharacterInfo = async (userObj) => {
    const charData = await fetchCharacterData(userObj);
    userObj.corporation_id = charData.corporation_id;
  };

  const storeCorpObjects = (esiObjectArray) => {
    const corporationData = filterAndReduceCorpData(esiObjectArray);

    updateCorpEsiData(corporationData);

    function filterAndReduceCorpData(esiObjectArray) {
      return esiObjectArray
        .filter(({ esiCorpPublicInfo }) => esiCorpPublicInfo)
        .reduce(
          (corpMap, { esiCorpDivisions, esiCorpPublicInfo, esiCorpAssets }) => {
            const corporationID = esiCorpPublicInfo.corporation_id;

            if (!corpMap.has(corporationID)) {
              corpMap.set(
                corporationID,
                createNewCorpData(
                  esiCorpDivisions,
                  esiCorpPublicInfo,
                  esiCorpAssets
                )
              );
            } else {
              updateExistingCorpData(
                corpMap.get(corporationID),
                esiCorpPublicInfo,
                esiCorpDivisions,
                esiCorpAssets
              );
            }

            return corpMap;
          },
          new Map()
        );
    }

    function createNewCorpData(
      esiCorpDivisions,
      esiCorpPublicInfo,
      esiCorpAssets
    ) {
      const staticHangars = {
        division: 0,
        name: "Projects",
        assetLocationRef: "CorporationGoalDeliveries",
      };

      const updatedHangarData = esiCorpDivisions?.hangar
        .map((hangarItem) => ({
          ...hangarItem,
          assetLocationRef: `CorpSAG${hangarItem.division}`,
        }))
        .concat([staticHangars]);

      if (esiCorpAssets.length > 0) {
        sessionStorage.setItem(
          `corpAssets_${esiCorpPublicInfo.corporation_id}`,
          JSON.stringify(esiCorpAssets)
        );
      }

      const officeLocations = esiCorpAssets.reduce((prev, asset) => {
        if (asset.location_flag === "OfficeFolder") {
          prev.add(asset.location_id);
        }
        return prev;
      }, new Set());

      return {
        alliance_id: esiCorpPublicInfo.alliance_id,
        name: esiCorpPublicInfo.name,
        tax_rate: esiCorpPublicInfo.tax_rate,
        ticker: esiCorpPublicInfo.ticker,
        corporation_id: esiCorpPublicInfo.corporation_id,
        hangars: updatedHangarData || null,
        wallets: esiCorpDivisions?.wallet || null,
        officeLocations: [...officeLocations],
      };
    }

    function updateExistingCorpData(
      existingCorp,
      esiCorpPublicInfo,
      esiCorpDivisions,
      esiCorpAssets
    ) {
      if (esiCorpAssets.length > 0) {
        sessionStorage.setItem(
          `corpAssets_${esiCorpPublicInfo.corporation_id}`,
          JSON.stringify(esiCorpAssets)
        );
      }

      const officeLocations = esiCorpAssets.reduce((prev, asset) => {
        if (asset.location_flag === "OfficeFolder") {
          prev.add(asset.location_id);
        }
        return prev;
      }, new Set());

      if (esiCorpDivisions && (!existingCorp.hangar || !existingCorp.wallet)) {
        existingCorp.hangars = esiCorpDivisions.hangar;
        existingCorp.wallets = esiCorpDivisions.wallet;
      }
      existingCorp.officeLocations = [
        ...new Set([...officeLocations, ...existingCorp.officeLocations]),
      ];
    }
  };

  const getSystemIndexData = async (userObject) => {
    const manufacturingStructures =
      userObject.settings.structures.manufacturing;
    const reactionStructures = userObject.settings.structures.reaction;

    const requestIDs = new Set(
      [...manufacturingStructures, ...reactionStructures].map(
        (entry) => entry.systemID
      )
    );

    const systemIndexData = await fetchSystemIndexes([...requestIDs]);

    return systemIndexData;
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
    getSystemIndexData,
    getLocationNames,
    logUserOut,
    removeUserEsiData,
    storeCorpObjects,
    storeESIData,
    tidyLinkedData,
    updateApiArray,
    updateCloudRefreshTokens,
    updateLocalRefreshTokens,
    updateUserEsiData,
  };
}
