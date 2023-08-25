import { useContext, useMemo } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
  UserWatchlistContext,
} from "../Context/AuthContext";
import { appCheck, firestore, functions, performance } from "../firebase";
import {
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import {
  ActiveJobContext,
  ApiJobsContext,
  ArchivedJobsContext,
  JobArrayContext,
  JobStatusContext,
  LinkedIDsContext,
} from "../Context/JobContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getToken } from "firebase/app-check";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import {
  EveIDsContext,
  EvePricesContext,
  SystemIndexContext,
} from "../Context/EveDataContext";
import { useAccountManagement } from "./useAccountManagement";
import { useEveApi } from "./useEveApi";
import { UserLoginUIContext } from "../Context/LayoutContext";
import GLOBAL_CONFIG from "../global-config-app";
import { updateStructureValues } from "./outdatedJobFunctions/convertJobStructures";

export function useFirebase() {
  const { users, updateUsers } = useContext(UsersContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { archivedJobs } = useContext(ArchivedJobsContext);
  const { updateFirebaseListeners } = useContext(FirebaseListenersContext);
  const { updateUserJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUserWatchlist } = useContext(UserWatchlistContext);
  const { updateJobArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { updateLinkedJobIDs, updateLinkedOrderIDs, updateLinkedTransIDs } =
    useContext(LinkedIDsContext);
  const {
    updateUserDataFetch,
    updateUserJobSnapshotDataFetch,
    updateUserWatchlistDataFetch,
    updateUserGroupsDataFetch,
  } = useContext(UserLoginUIContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const {
    buildApiArray,
    buildCloudAccountData,
    buildLocalAccountData,
    characterAPICall,
    checkUserClaims,
    getLocationNames,
    getSystemIndexData,
    storeCorpObjects,
    storeESIData,
    tidyLinkedData,
    updateCloudRefreshTokens,
    updateLocalRefreshTokens,
  } = useAccountManagement();
  const { serverStatus } = useEveApi();
  const analytics = getAnalytics();
  const { DEFAULT_ITEM_REFRESH_PERIOD, DEFAULT_ARCHIVE_REFRESH_PERIOD } =
    GLOBAL_CONFIG;

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser === true);
  }, [users]);

  const fbAuthState = async () => {
    let appCheckToken = await getToken(appCheck);
    if (isLoggedIn) {
      const auth = getAuth();
      if (auth.currentUser.stsTokenManager.expirationTime <= Date.now()) {
        let newfbuser = await firebaseAuth(parentUser);
      }
    }
  };

  const determineUserState = async (token) => {
    const buildNewUserProcess = async () => {
      const t = trace(performance, "NewUserCloudBuild");
      try {
        t.start();
        const buildData = httpsCallable(
          functions,
          "createUserData-createUserData"
        );
        const charData = await buildData();
        logEvent(analytics, "newUserCreation", {
          UID: charData.data.accountID,
        });
        t.stop();
      } catch (err) {
        console.log(err);
      }
    };
    if (token._tokenResponse.isNewUser) {
      await buildNewUserProcess();
    }
  };

  const addNewJob = async (job) => {
    await fbAuthState();
    setDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/Jobs`,
        job.jobID.toString()
      ),
      {
        deleted: false,
        archived: false,
        jobType: job.jobType,
        name: job.name,
        jobID: job.jobID,
        jobStatus: job.jobStatus,
        volume: job.volume,
        itemID: job.itemID,
        maxProductionLimit: job.maxProductionLimit,
        apiJobs: [...job.apiJobs],
        apiOrders: [...job.apiOrders],
        apiTransactions: [...job.apiTransactions],
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
        groupID: job.groupID || null,
        isReadyToSell: job.isReadyToSell || false,
        itemsProducedPerRun: job.itemsProducedPerRun
      }
    );
  };

  const uploadJob = async (job) => {
    await fbAuthState();
    updateDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/Jobs`,
        job.jobID.toString()
      ),
      {
        jobType: job.jobType,
        name: job.name,
        jobID: job.jobID,
        jobStatus: job.jobStatus,
        volume: job.volume,
        itemID: job.itemID,
        maxProductionLimit: job.maxProductionLimit,
        apiJobs: [...job.apiJobs],
        apiOrders: [...job.apiOrders],
        apiTransactions: [...job.apiTransactions],
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
        groupID: job.groupID || null,
        isReadyToSell: job.isReadyToSell || false,
        itemsProducedPerRun: job.itemsProducedPerRun || job.rawData.products[0].quantity
      }
    );
  };

  const updateMainUserDoc = async () => {
    await fbAuthState();

    updateDoc(doc(firestore, "Users", parentUser.accountID), {
      parentUserHash: parentUser.CharacterHash,
      jobStatusArray: jobStatus,
      linkedJobs: [...parentUser.linkedJobs],
      linkedTrans: [...parentUser.linkedTrans],
      linkedOrders: [...parentUser.linkedOrders],
      settings: parentUser.settings,
      refreshTokens: parentUser.accountRefreshTokens,
    });
  };

  const uploadUserJobSnapshot = async (newUserJobSnapshot) => {
    await fbAuthState();
    updateDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/ProfileInfo`,
        "JobSnapshot"
      ),
      {
        snapshot: newUserJobSnapshot,
      }
    );
  };

  const uploadUserWatchlist = async (itemGroups, itemWatchlist) => {
    await fbAuthState();
    updateDoc(
      doc(firestore, `Users/${parentUser.accountID}/ProfileInfo`, "Watchlist"),
      {
        groups: itemGroups,
        items: itemWatchlist,
      }
    );
  };

  const removeJob = async (job) => {
    await fbAuthState();

    deleteDoc(
      doc(firestore, `Users/${parentUser.accountID}/Jobs`, job.jobID.toString())
    );
  };

  const archiveJob = async (job) => {
    await fbAuthState();
    setDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/ArchivedJobs`,
        job.jobID.toString()
      ),
      {
        archived: true,
        archiveProcessed: false,
        jobType: job.jobType,
        name: job.name,
        jobID: job.jobID,
        jobStatus: job.jobStatus,
        volume: job.volume,
        itemID: job.itemID,
        maxProductionLimit: job.maxProductionLimit,
        apiJobs: [...job.apiJobs],
        apiOrders: [...job.apiOrders],
        apiTransactions: [...job.apiTransactions],
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
        groupID: job.groupID || null,
        isReadyToSell: job.isReadyToSell || false,
        itemsProducedPerRun: job.itemsProducedPerRun || job.rawData.products[0].quantity
      }
    );
  };

  const downloadCharacterJobs = async (jobID) => {
    await fbAuthState();
    const document = await getDoc(
      doc(firestore, `Users/${parentUser.accountID}/Jobs`, jobID.toString())
    );
    let downloadDoc = document.data();
    if (downloadDoc !== undefined) {
      let newJob = {
        hasListener: false,
        jobType: downloadDoc.jobType,
        name: downloadDoc.name,
        jobID: downloadDoc.jobID.toString(),
        jobStatus: downloadDoc.jobStatus,
        isSnapshot: false,
        volume: downloadDoc.volume,
        itemID: downloadDoc.itemID,
        maxProductionLimit: downloadDoc.maxProductionLimit,
        apiJobs: new Set(downloadDoc.apiJobs),
        apiOrders: new Set(downloadDoc.apiOrders),
        apiTransactions: new Set(downloadDoc.apiTransactions),
        skills: downloadDoc.skills,
        rawData: downloadDoc.rawData,
        build: downloadDoc.build,
        buildVer: downloadDoc.buildVer,
        metaLevel: downloadDoc.metaLevel,
        parentJob: downloadDoc.parentJob.map(String),
        blueprintTypeID: downloadDoc.blueprintTypeID,
        layout: downloadDoc.layout,
        groupID: downloadDoc.groupID,
        isReadyToSell: downloadDoc.isReadyToSell || false,
        itemsProducedPerRun: downloadDoc.itemsProducedPerRun || downloadDoc.rawData.products[0].quantity
      };

      // newJob.build.materials.forEach((mat) => {
      //   mat.childJob = mat.childJob.map(String);
      // });

      //updateOldJobs
      updateStructureValues(newJob);

      return newJob;
    } else {
      return undefined;
    }
  };

  const getItemPriceBulk = async (array, userObj) => {
    try {
      const appCheckToken = await getToken(appCheck, true);
      const itemsPricePromise = await fetch(
        `${import.meta.env.VITE_APIURL}/market-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Firebase-AppCheck": appCheckToken.token,
            accountID: userObj.accountID,
            appVersion: __APP_VERSION__,
          },
          body: JSON.stringify({
            idArray: array,
          }),
        }
      );
      const itemsPriceJson = await itemsPricePromise.json();
      if (itemsPricePromise.status === 200) {
        return itemsPriceJson;
      } else return [];
    } catch (err) {
      console.log(err);
    }
  };

    const getItemPrices = async (idArray, userObj) => {
      const t = trace(performance, "GetItemPrices");
      t.start();
      await fbAuthState();
      const MAX_CHUNK_SIZE = 500;
      let requestArray = [];
      let promiseArray = [];
      let returnData = [];

      if (idArray !== undefined && idArray.length > 0) {
        for (let id of idArray) {
          if (!evePrices.some((i) => i.typeID === id)) {
            requestArray.push(id);
          }
        }
      }
      if (requestArray.length > 0) {
        for (let x = 0; x < requestArray.length; x += MAX_CHUNK_SIZE) {
          let chunk = requestArray.slice(x, x + MAX_CHUNK_SIZE);
          let chunkData = getItemPriceBulk(chunk, userObj);
          promiseArray.push(chunkData);
        }
      } else {
        t.stop();
        return [];
      }

      let returnedPromise = await Promise.all(promiseArray);

      for (let data of returnedPromise) {
        if (Array.isArray(data)) {
          data.forEach((id) => {
            returnData.push(id);
          });
        } else {
          returnData.push(data);
        }
      }
      t.stop();
      return returnData;
    };

  const refreshItemPrices = async (userObj) => {
    const t = trace(performance, "refreshItemPrices");
    t.start();
    const CHUNK_SIZE = 500;
    const oldEvePrices = [...evePrices];
    const priceUpdates = new Set();
    const newEvePrices = [];

    oldEvePrices.forEach((item) => {
      if (
        item.lastUpdated <=
        Date.now() - DEFAULT_ITEM_REFRESH_PERIOD * 24 * 60 * 60 * 1000
      ) {
        priceUpdates.add(item.typeID);
      } else {
        newEvePrices.push(item);
      }
    });

    const requestArray = [...priceUpdates];
    if (requestArray.length > 0) {
      const promiseArray = [];
      for (let x = 0; x < requestArray.length; x += CHUNK_SIZE) {
        const chunk = requestArray.slice(x, x + CHUNK_SIZE);
        const chunkData = getItemPriceBulk(chunk, userObj);
        promiseArray.push(chunkData);
      }
      const returnPromiseArray = await Promise.all(promiseArray);
      for (let data of returnPromiseArray) {
        if (Array.isArray(data)) {
          data.forEach((id) => {
            newEvePrices.push(id);
          });
        } else {
          newEvePrices.push(data);
        }
      }
    }

    t.stop();
    return newEvePrices;
  };

  const getArchivedJobData = async (typeID) => {
    let newArchivedJobsArray = [...archivedJobs];

    if (!newArchivedJobsArray.some((i) => i.typeID == typeID)) {
      const document = await getDoc(
        doc(
          firestore,
          `Users/${parentUser.accountID}/BuildStats`,
          typeID.toString()
        )
      );

      if (document.exists()) {
        let docData = document.data();
        docData.lastUpdated = Date.now();

        if (newArchivedJobsArray.length > 10) {
          newArchivedJobsArray.shift();
          newArchivedJobsArray.push(docData);
        } else {
          newArchivedJobsArray.push(docData);
        }
      }
      return newArchivedJobsArray;
    } else {
      let index = newArchivedJobsArray.findIndex((i) => i.typeID === typeID);
      if (index !== -1) {
        if (
          newArchivedJobsArray[index].lastUpdated +
            DEFAULT_ARCHIVE_REFRESH_PERIOD * 24 * 60 * 60 * 1000 <=
          Date.now()
        ) {
          const document = await getDoc(
            doc(
              firestore,
              `Users/${parentUser.accountID}/BuildStats`,
              typeID.toString()
            )
          );
          if (document.exists()) {
            let docData = document.data();
            docData.lastUpdated = Date.now();
            newArchivedJobsArray[index] = docData;
            return newArchivedJobsArray;
          }
        } else {
          return newArchivedJobsArray;
        }
      }
    }
  };

  const userJobSnapshotListener = async (userObj) => {
    const unsub = onSnapshot(
      doc(firestore, `Users/${userObj.accountID}/ProfileInfo`, "JobSnapshot"),
      (doc) => {
        const updateSnapshotState = async () => {
          if (!doc.metadata.hasPendingWrites && doc.data() !== undefined) {
            const t = trace(performance, "UserJobSnapshotListener");
            t.start();
            updateUserJobSnapshotDataFetch(false);
            let snapshotData = doc.data().snapshot;
            let priceIDRequest = new Set();
            let newUserJobSnapshot = [];
            let newLinkedOrderIDs = new Set();
            let newLinkedJobIDs = new Set();
            let newLinkedTransIDs = new Set();
            snapshotData.forEach((snap) => {
              snap.jobID = snap.jobID.toString();
              snap.parentJob = snap.parentJob.map(String);
              snap.childJobs = snap.childJobs.map(String);

              snap.apiJobs.forEach((id) => {
                newLinkedJobIDs.add(id);
              });
              snap.apiOrders.forEach((id) => {
                newLinkedOrderIDs.add(id);
              });
              snap.apiTransactions.forEach((id) => {
                newLinkedTransIDs.add(id);
              });
              snap.materialIDs.forEach((id) => {
                priceIDRequest.add(id);
              });
              priceIDRequest.add(snap.itemID);
              newUserJobSnapshot.push(snap);
            });
            let newEvePrices = await getItemPrices(
              [...priceIDRequest],
              userObj
            );
            newUserJobSnapshot.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              }
              if (a.name > b.name) {
                return 1;
              }
              return 0;
            });
            updateLinkedJobIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedJobIDs])];
            });
            updateLinkedOrderIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedOrderIDs])];
            });
            updateLinkedTransIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedTransIDs])];
            });
            updateEvePrices((prev) => {
              const prevIds = new Set(prev.map((item) => item.typeID));
              const uniqueNewEvePrices = newEvePrices.filter(
                (item) => !prevIds.has(item.typeID)
              );
              return [...prev, ...uniqueNewEvePrices];
            });
            updateUserJobSnapshot(newUserJobSnapshot);
            updateUserJobSnapshotDataFetch(true);
            t.stop();
          }
        };
        updateSnapshotState();
      }
    );
    updateFirebaseListeners((prev) => prev.concat(unsub));
    return;
  };

  const userWatchlistListener = async (token, userObj) => {
    const unsub = onSnapshot(
      doc(firestore, `Users/${token.user.uid}/ProfileInfo`, "Watchlist"),
      (doc) => {
        const updateSnapshotState = async () => {
          if (!doc.metadata.hasPendingWrites && doc.data() !== undefined) {
            const t = trace(performance, "UserWatchlistListener");
            t.start();
            updateUserWatchlistDataFetch(false);
            let snapshotData = doc.data();
            let priceIDRequest = new Set();
            let newWatchlistGroups = [];
            let newWatchlistItems = [];
            snapshotData.groups.forEach((group) => {
              newWatchlistGroups.push(group);
            });
            snapshotData.items.forEach((item) => {
              priceIDRequest.add(item.typeID);
              item.materials.forEach((mat) => {
                priceIDRequest.add(mat.typeID);
                mat.materials.forEach((cMat) => {
                  priceIDRequest.add(cMat.typeID);
                });
              });
              newWatchlistItems.push(item);
            });
            let newEvePrices = await getItemPrices(
              [...priceIDRequest],
              userObj
            );
            updateEvePrices((prev) => {
              const prevIds = new Set(prev.map((item) => item.typeID));
              const uniqueNewEvePrices = newEvePrices.filter(
                (item) => !prevIds.has(item.typeID)
              );
              return [...prev, ...uniqueNewEvePrices];
            });
            updateUserWatchlist({
              groups: newWatchlistGroups,
              items: newWatchlistItems,
            });
            updateUserWatchlistDataFetch(true);
            t.stop();
          }
        };
        updateSnapshotState();
      }
    );
    updateFirebaseListeners((prev) => prev.concat(unsub));
    return;
  };

  const userJobListener = async (userObj, JobID) => {
    const unsub = onSnapshot(
      doc(firestore, `Users/${userObj.accountID}/Jobs`, JobID.toString()),
      (doc) => {
        if (!doc.metadata.hasPendingWrites && doc.data() !== undefined) {
          const t = trace(performance, "UserJobListener");
          t.start();
          let downloadDoc = doc.data();
          let newJob = {
            jobType: downloadDoc.jobType,
            name: downloadDoc.name,
            jobID: downloadDoc.jobID.toString(),
            jobStatus: downloadDoc.jobStatus,
            isSnapshot: false,
            volume: downloadDoc.volume,
            itemID: downloadDoc.itemID,
            maxProductionLimit: downloadDoc.maxProductionLimit,
            apiJobs: new Set(downloadDoc.apiJobs),
            apiOrders: new Set(downloadDoc.apiOrders),
            apiTransactions: new Set(downloadDoc.apiTransactions),
            skills: downloadDoc.skills,
            rawData: downloadDoc.rawData,
            build: downloadDoc.build,
            buildVer: downloadDoc.buildVer,
            metaLevel: downloadDoc.metaLevel,
            parentJob: downloadDoc.parentJob.map(String),
            blueprintTypeID: downloadDoc.blueprintTypeID,
            layout: downloadDoc.layout,
            groupID: downloadDoc.groupID,
            isReadyToSell: downloadDoc.isReadyToSell || false,
            itemsProducedPerRun: downloadDoc.itemsProducedPerRun || downloadDoc.rawData.products[0].quantity
          };
          // newJob.build.materials.forEach((mat) => {
          //   mat.childJob = mat.childJob.map(String);
          // });

          //updateOldJobs
          updateStructureValues(newJob);

          if (activeJob.jobID == newJob.jobID) {
            updateActiveJob(newJob);
          }
          updateJobArray((prev) => {
            const index = prev.findIndex((i) => i.jobID === newJob.jobID);
            if (index === -1) {
              return [...prev, newJob];
            }
            return prev.map((job, idx) => (idx === index ? newJob : job));
          });
          t.stop();
        }
      }
    );
    updateFirebaseListeners((prev) => prev.concat(unsub));
  };

  const userMaindDocListener = async (token, userObject) => {
    const unsub = onSnapshot(doc(firestore, "Users", token.user.uid), (doc) => {
      const updateMainDocData = async () => {
        if (!doc.metadata.hasPendingWrites && doc.data() !== undefined) {
          const t = trace(performance, "MainUserDocListener");
          t.start();
          updateUserDataFetch(false);
          let userData = doc.data();
          let newUserArray = [userObject];
          let esiOjectArray = [];
          let mainUser = newUserArray.find((i) => i.ParentUser);
          mainUser.accountID = userData.accountID;
          mainUser.settings = userData.settings;
          serverStatus();
          let mainUserESIObject = await characterAPICall(mainUser);
          esiOjectArray.push(mainUserESIObject);

          if (userData.settings.account.cloudAccounts) {
            await buildCloudAccountData(
              userData.refreshTokens,
              newUserArray,
              esiOjectArray
            );
            mainUser.accountRefreshTokens = updateCloudRefreshTokens(
              userData.refreshTokens,
              newUserArray
            );
            await storeESIData(esiOjectArray);
            storeCorpObjects(esiOjectArray);
          }
          if (!userData.settings.account.cloudAccounts) {
            await buildLocalAccountData(newUserArray, esiOjectArray);
            updateLocalRefreshTokens(newUserArray);
            await storeESIData(esiOjectArray);
            storeCorpObjects(esiOjectArray);
          }
          tidyLinkedData(
            userData.linkedJobs,
            userData.linkedOrders,
            userData.linkedTrans,
            mainUser,
            newUserArray,
            esiOjectArray
          );
          let newApiArray = buildApiArray(newUserArray, esiOjectArray);
          await checkUserClaims(newUserArray);
          let names = await getLocationNames(
            newUserArray,
            mainUser,
            esiOjectArray
          );
          const systemIndexes = await getSystemIndexData(mainUser);
          newUserArray.sort((a, b) => {
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          });
          updateEveIDs(names);
          updateSystemIndexData(systemIndexes);
          updateApiJobs(newApiArray);
          updateUsers(newUserArray);
          setJobStatus(userData.jobStatusArray);
          updateUserDataFetch(true);
          t.stop();
        }
      };
      updateMainDocData();
    });
    updateFirebaseListeners((prev) => prev.concat(unsub));
  };

  const uploadGroups = async (groupSnapshot) => {
    await fbAuthState();
    updateDoc(
      doc(firestore, `Users/${parentUser.accountID}/ProfileInfo`, "GroupData"),
      {
        groupData: groupSnapshot,
      }
    );
  };

  const userGroupDataListener = async (userObj) => {
    const unsub = onSnapshot(
      doc(firestore, `Users/${userObj.accountID}/ProfileInfo`, "GroupData"),
      (doc) => {
        const updateGroupData = async () => {
          if (!doc.metadata.hasPendingWrites && doc.data() !== undefined) {
            const t = trace(performance, "UserGroupListener");
            t.start();
            updateUserGroupsDataFetch(false);
            let groupData = doc.data().groupData;
            let newLinkedOrderIDs = new Set();
            let newLinkedJobIDs = new Set();
            let newLinkedTransIDs = new Set();
            for (let group of groupData) {
              group.areComplete = group.areComplete.map(String);
              group.includedJobIDs = group.includedJobIDs.map(String);
              group?.linkedJobIDs?.forEach((id) => {
                newLinkedJobIDs.add(id);
              });
              group?.linkedOrderIDs?.forEach((id) => {
                newLinkedOrderIDs.add(id);
              });
              group?.linkedTransIDs?.forEach((id) => {
                newLinkedTransIDs.add(id);
              });
            }
            updateLinkedJobIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedJobIDs])];
            });
            updateLinkedOrderIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedOrderIDs])];
            });
            updateLinkedTransIDs((prevState) => {
              return [...new Set([...prevState, ...newLinkedTransIDs])];
            });
            updateGroupArray(groupData);
            updateUserGroupsDataFetch(true);
            t.stop();
          }
        };
        updateGroupData();
      }
    );
    updateFirebaseListeners((prev) => prev.concat(unsub));
  };

  return {
    addNewJob,
    archiveJob,
    determineUserState,
    getArchivedJobData,
    getItemPrices,
    uploadJob,
    updateMainUserDoc,
    refreshItemPrices,
    removeJob,
    downloadCharacterJobs,
    userGroupDataListener,
    userJobListener,
    userJobSnapshotListener,
    userMaindDocListener,
    userWatchlistListener,
    uploadGroups,
    uploadUserJobSnapshot,
    uploadUserWatchlist,
  };
}
