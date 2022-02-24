import { useContext } from "react";
import { UsersContext } from "../Context/AuthContext";
import { firestore, functions, performance } from "../firebase";
import {
  doc,
  deleteDoc,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { JobArrayContext, JobStatusContext } from "../Context/JobContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { EvePricesContext } from "../Context/EveDataContext";

export function useFirebase() {
  const { users } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { jobStatus } = useContext(JobStatusContext);
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const fbAuthState = async () => {
    const auth = getAuth();
    if (auth.currentUser == null) {
      let newfbuser = await firebaseAuth(parentUser);
      console.log(newfbuser);
    }
  };

  const determineUserState = async (user) => {
    if (user.fbToken._tokenResponse.isNewUser) {
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
        };
      } catch (err) {
        console.log(err);
      }
    }
    if (!user.fbToken._tokenResponse.isNewUser) {
      const CharSnap = await getDoc(doc(firestore, "Users", user.accountID));
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
      }
    );
  };

  const updateMainUserDoc = async (newUserArray) => {
    await fbAuthState();
    try {
      await runTransaction(firestore, async (t) => {
        const docRef = doc(firestore, `Users/${parentUser.accountID}`);
        const userDoc = await t.get(docRef);
        t.update(userDoc.ref, {
          jobArraySnapshot: parentUser.snapshotData,
          parentUserHash: parentUser.CharacterHash,
          jobStatusArray: jobStatus,
          linkedJobs: parentUser.linkedJobs,
          linkedTrans: parentUser.linkedTrans,
          linkedOrders: parentUser.linkedOrders,
          settings: parentUser.settings,
        });
      });
    } catch (err) {
      console.log(err);
    }
  };

  const removeJob = async (job) => {
    await fbAuthState();

    deleteDoc(
      doc(firestore, `Users/${parentUser.accountID}/Jobs`, job.jobID.toString())
    );
  };

  const archivedJob = async (job) => {
    await fbAuthState();
    updateDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/Jobs`,
        job.jobID.toString()
      ),
      { archived: true }
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
    };

    return newJob;
  };

  const getItemPrices = async (inputJob) => {
    const t = trace(performance, "GetItemPrices");
    t.start();
    let promiseArray = [];
    let returnArray = [];
    const getPrice = (typeID) => {
      try {
        const itemPricePromise = fetch(
          `https://us-central1-eve-industry-planner-pricedata.cloudfunctions.net/costs/item/${typeID}`
        );
        return itemPricePromise;
      } catch (err) {}
    };

    if (!evePrices.some((i) => i.typeID === inputJob.itemID)) {
      let mainPriceJSON = getPrice(inputJob.itemID);
      promiseArray.push(mainPriceJSON);
    }
    for (let material of inputJob.build.materials) {
      if (!evePrices.some((i) => i.typeID === material.typeID)) {
        let priceJSON = getPrice(material.typeID);
        promiseArray.push(priceJSON);
      }
    }
    let returnedPromises = await Promise.all(promiseArray);

    for (let promise of returnedPromises) {
      let json = await promise.json();
      returnArray.push(json);
    }
    t.stop();
    return returnArray;
  };

  return {
    addNewJob,
    archivedJob,
    determineUserState,
    getItemPrices,
    uploadJob,
    updateMainUserDoc,
    removeJob,
    downloadCharacterJobs,
  };
}
