import { useContext } from "react";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { appCheck, firestore, functions, performance } from "../firebase";
import { doc, deleteDoc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { ArchivedJobsContext, JobStatusContext } from "../Context/JobContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getToken } from "firebase/app-check";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { EvePricesContext } from "../Context/EveDataContext";

export function useFirebase() {
  const { users } = useContext(UsersContext);
  const { evePrices } = useContext(EvePricesContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { archivedJobs } = useContext(ArchivedJobsContext);
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const fbAuthState = async () => {
    let appCheckToken = await getToken(appCheck);
    if (isLoggedIn) {
      const auth = getAuth();
      if (auth.currentUser.stsTokenManager.expirationTime <= Date.now()) {
        let newfbuser = await firebaseAuth(parentUser);
      }
    }
  };

  const determineUserState = async (user) => {
    const buildNewUserProcess = async () => {
      const t = trace(performance, "NewUserCloudBuild");
      t.start();
      try {
        const buildData = httpsCallable(functions, "user-createUserData");
        const charData = await buildData();
        logEvent(analytics, "newUserCreation", {
          UID: charData.data.accountID,
        });
        t.stop();
        return {
          accountID: charData.data.accountID,
          jobStatusArray: charData.data.jobStatusArray,
          jobArraySnapshot: [],
          linkedJobs: charData.data.linkedJobs,
          linkedOrders: charData.data.linkedOrders,
          linkedTrans: charData.data.linkedTrans,
          settings: charData.data.settings,
          refreshTokens: charData.data.refreshTokens,
        };
      } catch (err) {
        console.log(err);
      }
    };

    if (user.fbToken._tokenResponse.isNewUser) {
      let newUser = await buildNewUserProcess();
      return newUser;
    }
    if (!user.fbToken._tokenResponse.isNewUser) {
      const CharSnap = await getDoc(doc(firestore, "Users", user.accountID));

      if (CharSnap.data() !== undefined) {
        const charData = CharSnap.data();
        const newJobArray = [];
        for (let i in charData.jobArraySnapshot) {
          newJobArray.push(charData.jobArraySnapshot[i]);
        }

        newJobArray.sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name < b.name) {
            return 1;
          }
          return 0;
        });
        charData.jobArraySnapshot = newJobArray;

        return charData;
      } else {
        let newUser = await buildNewUserProcess();
        return newUser;
      }
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
        apiJobs: job.apiJobs,
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
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
        apiJobs: job.apiJobs,
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
      }
    );
  };

  const uploadJobAsSnapshot = async (job) => {
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
        itemID: job.itemID,
        runCount: job.runCount,
        jobCount: job.jobCount,
        apiJobs: job.apiJobs,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
      }
    );
  };

  const updateMainUserDoc = async () => {
    await fbAuthState();

    updateDoc(doc(firestore, "Users", parentUser.accountID), {
      jobArraySnapshot: parentUser.snapshotData,
      parentUserHash: parentUser.CharacterHash,
      jobStatusArray: jobStatus,
      linkedJobs: parentUser.linkedJobs,
      linkedTrans: parentUser.linkedTrans,
      linkedOrders: parentUser.linkedOrders,
      settings: parentUser.settings,
      refreshTokens: parentUser.accountRefreshTokens,
    });
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
        apiJobs: job.apiJobs,
        skills: job.skills,
        rawData: job.rawData,
        build: job.build,
        buildVer: job.buildVer,
        metaLevel: job.metaLevel,
        parentJob: job.parentJob,
        blueprintTypeID: job.blueprintTypeID,
        layout: job.layout,
      }
    );
  };

  const downloadCharacterJobs = async (job) => {
    await fbAuthState();

    const document = await getDoc(
      doc(firestore, `Users/${parentUser.accountID}/Jobs`, job.jobID.toString())
    );
    let newJob = {
      isSnapshot: false,
      jobType: document.data().jobType,
      name: document.data().name,
      jobID: document.data().jobID,
      jobStatus: document.data().jobStatus,
      volume: document.data().volume,
      itemID: document.data().itemID,
      maxProductionLimit: document.data().maxProductionLimit,
      runCount: document.data().runCount,
      jobCount: document.data().jobCount,
      bpME: document.data().bpME,
      bpTE: document.data().bpTE,
      structureType: document.data().structureType,
      structureTypeDisplay: document.data().structureTypeDisplay,
      rigType: document.data().rigType,
      systemType: document.data().systemType,
      apiJobs: document.data().apiJobs,
      skills: document.data().skills,
      rawData: document.data().rawData,
      build: document.data().build,
      buildVer: document.data().buildVer,
      metaLevel: document.data().metaLevel,
      parentJob: document.data().parentJob,
      blueprintTypeID: document.data().blueprintTypeID,
      layout: document.data().layout,
    };

    return newJob;
  };

  const getItemPriceBulk = async (array) => {
    try {
      const appCheckToken = await getToken(appCheck, true);
      const itemsPricePromise = await fetch(
        `${process.env.REACT_APP_APIURL}/costs/bulkPrices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Firebase-AppCheck": appCheckToken.token,
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

  const getItemPrices = async (idArray) => {
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
        let chunkData = getItemPriceBulk(chunk);
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

  const refreshItemPrices = async () => {
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
        let chunkData = getItemPriceBulk(chunk);
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

  return {
    addNewJob,
    archiveJob,
    determineUserState,
    getArchivedJobData,
    getItemPrices,
    uploadJob,
    uploadJobAsSnapshot,
    updateMainUserDoc,
    refreshItemPrices,
    removeJob,
    downloadCharacterJobs,
  };
}
