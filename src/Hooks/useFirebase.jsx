import { useContext } from "react";
import { UsersContext } from "../Context/AuthContext";
import { firestore, functions, performance, auth } from "../firebase";
import { doc, deleteDoc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { JobArrayContext, JobStatusContext } from "../Context/JobContext";
import { getAnalytics, logEvent } from "firebase/analytics";
// import { firebaseAuth } from "../Components/Auth/firebaseAuth";
// import { getAuth, getIdToken } from "firebase/auth";

export function useFirebase() {
  const { users } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const determineFBState = async () => {
    //1 hour timeout
    // if (
    //   parentUser.fbToken === undefined ||
    //   parentUser.fbToken.user === undefined ||
    //   Date.parse(parentUser.fbToken.user.stsTokenManager.expirationTime) <=
    //     Date.now()
    // ) {

    // }
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
    parentUser.fbToken = await determineFBState();

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
        buildVer: job.buildVer
      }
    );
  };

  const uploadJob = async (job) => {
    await determineFBState();
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
        buildVer: job.buildVer
      }
    );
  };

  const uploadSnapshotData = async (job) => {
    await determineFBState();
    updateDoc(
      doc(
        firestore,
        `Users/${parentUser.accountID}/Jobs`,
        job.jobID.toString()
      ),
      {
        jobID: job.jobID,
        jobStatus: job.jobStatus,
        name: job.name,
        itemID: job.itemID,
        jobType: job.jobType,
        runCount: job.runCount,
        jobCount: job.jobCount,
        apiJobs: job.apiJobs,
        buildVer: job.buildVer
      }
    );
  };

  const updateMainUserDoc = async () => {
    await determineFBState();
    updateDoc(doc(firestore, "Users", parentUser.accountID), {
      parentUserHash: parentUser.CharacterHash,
      jobStatusArray: jobStatus,
      linkedJobs: parentUser.linkedJobs,
      linkedTrans: parentUser.linkedTrans,
      linkedOrders: parentUser.linkedOrders,
      settings: parentUser.settings,
    });
  };

  const removeJob = async (job) => {
    await determineFBState();

    deleteDoc(
      doc(firestore, `Users/${parentUser.accountID}/Jobs`, job.jobID.toString())
    );
  };

  const archivedJob = async (job) => {
    await determineFBState();
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
    await determineFBState();

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
      buildVer: document.data().build
    };

    const index = jobArray.findIndex((x) => job.jobID === x.jobID);
    const newArray = [...jobArray];
    newArray[index] = newJob;
    updateJobArray(newArray);
    return newJob;
  };

  return {
    archivedJob,
    determineUserState,
    determineFBState,
    addNewJob,
    uploadJob,
    uploadSnapshotData,
    updateMainUserDoc,
    removeJob,
    downloadCharacterJobs,
  };
}
