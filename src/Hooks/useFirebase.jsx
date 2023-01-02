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
import { EveIDsContext, EvePricesContext } from "../Context/EveDataContext";
import { useAccountManagement } from "./useAccountManagement";

export function useFirebase() {
  const { users, updateUserDataFetch, updateUsers } = useContext(UsersContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { archivedJobs } = useContext(ArchivedJobsContext);
  const { updateFirebaseListeners } = useContext(FirebaseListenersContext);
  const { updateUserJobSnapshot, updateUserJobSnapshotDataFetch } = useContext(
    UserJobSnapshotContext
  );
  const { updateEveIDs } = useContext(EveIDsContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUserWatchlist, updateUserWatchlistDataFetch } =
    useContext(UserWatchlistContext);
  const { jobArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { updateLinkedJobIDs, updateLinkedOrderIDs, updateLinkedTransIDs } =
    useContext(LinkedIDsContext);
  const {
    buildApiArray,
    buildCloudAccountData,
    buildLocalAccountData,
    checkUserClaims,
    getCharacterInfo,
    getLocationNames,
    tidyLinkedData,
    updateCloudRefreshTokens,
    updateLocalRefreshTokens,
  } = useAccountManagement();
  const analytics = getAnalytics();

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
        const buildData = httpsCallable(functions, "buildUser-createUserData");
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
        runCount: job.runCount,
        jobCount: job.jobCount,
        bpME: job.bpME,
        bpTE: job.bpTE,
        structureType: job.structureType,
        structureTypeDisplay: job.structureTypeDisplay,
        rigType: job.rigType,
        systemType: job.systemType,
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
        runCount: job.runCount,
        jobCount: job.jobCount,
        bpME: job.bpME,
        bpTE: job.bpTE,
        structureType: job.structureType,
        structureTypeDisplay: job.structureTypeDisplay,
        rigType: job.rigType,
        systemType: job.systemType,
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
        runCount: job.runCount,
        jobCount: job.jobCount,
        bpME: job.bpME,
        bpTE: job.bpTE,
        structureType: job.structureType,
        structureTypeDisplay: job.structureTypeDisplay,
        rigType: job.rigType,
        systemType: job.systemType,
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
        jobID: downloadDoc.jobID,
        jobStatus: downloadDoc.jobStatus,
        isSnapshot: false,
        volume: downloadDoc.volume,
        itemID: downloadDoc.itemID,
        maxProductionLimit: downloadDoc.maxProductionLimit,
        runCount: downloadDoc.runCount,
        jobCount: downloadDoc.jobCount,
        bpME: downloadDoc.bpME,
        bpTE: downloadDoc.bpTE,
        structureType: downloadDoc.structureType,
        structureTypeDisplay: downloadDoc.structureTypeDisplay,
        rigType: downloadDoc.rigType,
        systemType: downloadDoc.systemType,
        apiJobs: new Set(downloadDoc.apiJobs),
        apiOrders: new Set(downloadDoc.apiOrders),
        apiTransactions: new Set(downloadDoc.apiTransactions),
        skills: downloadDoc.skills,
        rawData: downloadDoc.rawData,
        build: downloadDoc.build,
        buildVer: downloadDoc.buildVer,
        metaLevel: downloadDoc.metaLevel,
        parentJob: downloadDoc.parentJob,
        blueprintTypeID: downloadDoc.blueprintTypeID,
        layout: downloadDoc.layout,
        groupID: downloadDoc.groupID,
      };

      return newJob;
    } else {
      return undefined;
    }
  };

  const getItemPriceBulk = async (array, userObj) => {
    try {
      const appCheckToken = await getToken(appCheck, true);
      const itemsPricePromise = await fetch(
        `${import.meta.env.VITE_APIURL}/costs/bulkPrices`,
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
      for (let x = 0; x < requestArray.length; x += 30) {
        let chunk = requestArray.slice(x, x + 30);
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
    await fbAuthState();
    let promiseArray = [];
    let oldEvePrices = [...evePrices];
    let priceUpdates = new Set();

    oldEvePrices.forEach((item) => {
      if (item.lastUpdated <= Date.now() - 14400000) {
        priceUpdates.add(item.typeID);
      }
    });
    let newEvePrices = oldEvePrices.filter((i) => !priceUpdates.has(i.typeID));
    let requestArray = [...priceUpdates];
    if (requestArray.length > 0) {
      for (let x = 0; x < requestArray.length; x += 30) {
        let chunk = requestArray.slice(x, x + 30);
        let chunkData = getItemPriceBulk(chunk, userObj);
        promiseArray.push(chunkData);
      }
    } else {
      t.stop();
      return newEvePrices;
    }
    let returnPromiseArray = await Promise.all(promiseArray);

    for (let data of returnPromiseArray) {
      if (Array.isArray(data)) {
        data.forEach((id) => {
          newEvePrices.push(id);
        });
      } else {
        newEvePrices.push(data);
      }
    }
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
        if (newArchivedJobsArray[index].lastUpdated + 10800000 <= Date.now()) {
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
            updateUserJobSnapshotDataFetch(true);
            let snapshotData = doc.data();
            let priceIDRequest = new Set();
            let newUserJobSnapshot = [];
            let newLinkedOrderIDs = new Set();
            let newLinkedJobIDs = new Set();
            let newLinkedTransIDs = new Set();
            snapshotData.snapshot.forEach((snap) => {
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
            updateLinkedJobIDs([...newLinkedJobIDs]);
            updateLinkedOrderIDs([...newLinkedOrderIDs]);
            updateLinkedTransIDs([...newLinkedTransIDs]);
            updateEvePrices((prev) => {
              newEvePrices = newEvePrices.filter(
                (n) => !prev.some((p) => p.typeID === n.typeID)
              );
              return prev.concat(newEvePrices);
            });
            updateUserJobSnapshot(newUserJobSnapshot);
            updateUserJobSnapshotDataFetch(false);
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
            updateUserWatchlistDataFetch(true);
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
              newEvePrices = newEvePrices.filter(
                (n) => !prev.some((p) => p.typeID === n.typeID)
              );
              return prev.concat(newEvePrices);
            });
            updateUserWatchlist({
              groups: newWatchlistGroups,
              items: newWatchlistItems,
            });
            updateUserWatchlistDataFetch(false);
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
          let newJobArray = [...jobArray];
          let newJob = {
            jobType: downloadDoc.jobType,
            name: downloadDoc.name,
            jobID: downloadDoc.jobID,
            jobStatus: downloadDoc.jobStatus,
            isSnapshot: false,
            volume: downloadDoc.volume,
            itemID: downloadDoc.itemID,
            maxProductionLimit: downloadDoc.maxProductionLimit,
            runCount: downloadDoc.runCount,
            jobCount: downloadDoc.jobCount,
            bpME: downloadDoc.bpME,
            bpTE: downloadDoc.bpTE,
            structureType: downloadDoc.structureType,
            structureTypeDisplay: downloadDoc.structureTypeDisplay,
            rigType: downloadDoc.rigType,
            systemType: downloadDoc.systemType,
            apiJobs: new Set(downloadDoc.apiJobs),
            apiOrders: new Set(downloadDoc.apiOrders),
            apiTransactions: new Set(downloadDoc.apiTransactions),
            skills: downloadDoc.skills,
            rawData: downloadDoc.rawData,
            build: downloadDoc.build,
            buildVer: downloadDoc.buildVer,
            metaLevel: downloadDoc.metaLevel,
            parentJob: downloadDoc.parentJob,
            blueprintTypeID: downloadDoc.blueprintTypeID,
            layout: downloadDoc.layout,
            groupID: downloadDoc.groupID,
          };
          let index = jobArray.findIndex((i) => i.jobID === newJob.jobID);
          if (index === -1) {
            newJobArray.push(newJob);
          } else {
            newJobArray[index] = newJob;
          }
          if (activeJob.jobID === newJob.jobID) {
            updateActiveJob(newJob);
          }
          updateJobArray(newJobArray);
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
          updateUserDataFetch(true);
          let userData = doc.data();
          let newUserArray = [userObject];
          let mainUser = newUserArray.find((i) => i.ParentUser);
          mainUser.accountID = userData.accountID;
          mainUser.settings = userData.settings;

          if (userData.settings.account.cloudAccounts) {
            newUserArray = await buildCloudAccountData(
              userData.refreshTokens,
              newUserArray
            );
            mainUser.accountRefreshTokens = updateCloudRefreshTokens(
              userData.refreshTokens,
              newUserArray
            );
          }
          if (!userData.settings.account.cloudAccounts) {
            newUserArray = await buildLocalAccountData(newUserArray);
            updateLocalRefreshTokens(newUserArray);
          }
          tidyLinkedData(
            userData.linkedJobs,
            userData.linkedOrders,
            userData.linkedTrans,
            mainUser,
            newUserArray
          );
          let newApiArray = buildApiArray(newUserArray);
          await checkUserClaims(newUserArray);
          let names = await getLocationNames(newUserArray, mainUser);
          updateEveIDs(names);
          updateApiJobs(newApiArray);
          updateUsers(newUserArray);
          setJobStatus(userData.jobStatusArray);
          updateUserDataFetch(false);
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
            let groupData = doc.data().groupData;
            let priceIDRequest = new Set();
            for (let group of groupData) {
              priceIDRequest = new Set([
                ...priceIDRequest,
                ...group.materialIDs,
              ]);
            }
            let itemPrices = await getItemPrices([...priceIDRequest], userObj);
            updateGroupArray(groupData);
            updateEvePrices((prev) => {
              itemPrices = itemPrices.filter(
                (n) => !prev.some((p) => p.typeID === n.typeID)
              );
              return prev.concat(itemPrices);
            });
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
