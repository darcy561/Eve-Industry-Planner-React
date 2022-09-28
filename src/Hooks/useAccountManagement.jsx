import { useEveApi } from "./useEveApi";
import { getAnalytics, logEvent } from "firebase/analytics";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
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
import { EveIDsContext } from "../Context/EveDataContext";
import { SnackBarDataContext } from "../Context/LayoutContext";
import {
  apiJobsDefault,
  jobArrayDefault,
  jobStatusDefault,
  usersDefault,
  eveIDsDefault,
  userJobSnapshotDefault,
} from "../Context/defaultValues";

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
  const {firebaseListeners, updateFirebaseListeners} = useContext(FirebaseListenersContext)

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser), [users];
  });

  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletJournal,
    WalletTransactions,
    fullAssetsList,
    IDtoName,
    standingsList,
  } = useEveApi();
  const analytics = getAnalytics();
  const navigate = useNavigate();

  const buildMainUser = (userObject, userSettings) => {
    userObject.accountID = userSettings.accountID;
    userObject.linkedJobs = userSettings.linkedJobs;
    userObject.linkedTrans = userSettings.linkedTrans;
    userObject.linkedOrders = userSettings.linkedOrders;
    userObject.settings = userSettings.settings;
    userObject.accountRefreshTokens = userSettings.refreshTokens;

    return userObject;
  };

  const characterAPICall = async (sStatus, userObject, parentObject) => {
    if (sStatus) {
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
      ] = await Promise.all([
        CharacterSkills(userObject),
        IndustryJobs(userObject, parentObject),
        MarketOrders(userObject),
        HistoricMarketOrders(userObject),
        BlueprintLibrary(userObject),
        WalletTransactions(userObject),
        WalletJournal(userObject),
        fullAssetsList(userObject),
        standingsList(userObject),
      ]);

      userObject.apiSkills = skills;
      userObject.apiJobs = indJobs;
      userObject.apiOrders = orders;
      userObject.apiHistOrders = histOrders;
      userObject.apiBlueprints = blueprints;
      userObject.apiTransactions = transactions;
      userObject.apiJournal = journal;
      sessionStorage.setItem(
        `assets_${userObject.CharacterHash}`,
        JSON.stringify(assets)
      );
      userObject.standings = standings;
    } else {
      userObject.apiSkills = [];
      userObject.apiJobs = [];
      userObject.apiOrders = [];
      userObject.apiHistOrders = [];
      userObject.apiBlueprints = [];
      userObject.apiTransactions = [];
      userObject.apiJournal = [];
      sessionStorage.setItem(
        `assets_${userObject.CharacterHash}`,
        JSON.stringify([])
      );
      userObject.standings = [];
    }

    return userObject;
  };


  const getLocationNames = async (users, mainUser) => {
    let locationIDS = new Set();
    let citadelStore = new Set();
    let newIDNamePromises = [];
    let newNameArray = [];

    for (let user of users) {
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
      unsub()
    })
    updateFirebaseListeners([])
    updateIsLoggedIn(false);
    updateUsers(usersDefault);
    updateUserJobSnapshot(userJobSnapshotDefault);
    updateJobArray(jobArrayDefault);
    updateEveIDs(eveIDsDefault);
    setJobStatus(jobStatusDefault);
    updateActiveJob({});
    updateArchivedJobs([]);
    updateApiJobs(apiJobsDefault);
    updateUserWatchlist({groups:[], items:[]})
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

  return {
    buildMainUser,
    characterAPICall,
    getLocationNames,
    logUserOut,
  };
}
