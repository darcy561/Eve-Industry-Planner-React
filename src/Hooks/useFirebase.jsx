import { useCallback, useContext } from "react";
import { IsLoggedInContext, MainUserContext } from "../Context/AuthContext";
import { firestore, functions, performance } from "../firebase";
import { doc, deleteDoc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { JobArrayContext, JobStatusContext } from "../Context/JobContext";

export function useFirebase() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);

  const determineUserState = useCallback(async (user, fbToken) => {
    if (fbToken._tokenResponse.isNewUser) {
      const t = trace(performance, "NewUserCloudBuild");
      t.start();
      try {
        const buildData = httpsCallable(functions, "user-createUserData");
        const charData = await buildData();
        t.stop();
        return {
          accountID: charData.data.accountID,
          jobStatusArray: charData.data.jobStatusArray,
          jobArraySnapshot: [],
          linkedJobs: charData.data.linkedJobs,
        };
      } catch (err) {
        console.log(err);
      }
    }
    if (!fbToken._tokenResponse.isNewUser) {
      const CharSnap = await getDoc(doc(firestore, "Users", user.accountID));
      const charData = CharSnap.data();
      const newJobArray = [];
      for (let i in charData.jobArraySnapshot) {
        newJobArray.push(charData.jobArraySnapshot[i]);
      }
      charData.jobArraySnapshot = newJobArray;

      return charData;
    }
  });

  const addNewJob = useCallback(
    async (job) => {
      setDoc(
        doc(
          firestore,
          `Users/${mainUser.accountID}/Jobs`,
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
          skills: JSON.stringify(job.skills),
          rawData: JSON.stringify(job.rawData),
          build: JSON.stringify(job.build),
        }
      );
    },
    [isLoggedIn, mainUser]
  );

  const uploadJob = useCallback(
    async (job) => {
      updateDoc(
        doc(
          firestore,
          `Users/${mainUser.accountID}/Jobs`,
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
          skills: JSON.stringify(job.skills),
          rawData: JSON.stringify(job.rawData),
          build: JSON.stringify(job.build),
        }
      );
    },
    [isLoggedIn, mainUser]
  );

  const updateMainUserDoc = useCallback(async () => {
    updateDoc(doc(firestore, "Users", mainUser.accountID), {
      jobStatusArray: jobStatus,
      linkedJobs: mainUser.linkedJobs,
    });
  }, [isLoggedIn, mainUser]);

  const removeJob = useCallback(
    async (job) => {
      deleteDoc(
        doc(firestore, `Users/${mainUser.accountID}/Jobs`, job.jobID.toString())
      );
    },
    [isLoggedIn, mainUser]
  );

  const downloadCharacterJobs = useCallback(
    async (job) => {
      const document = await getDoc(
        doc(firestore, `Users/${mainUser.accountID}/Jobs`, job.jobID.toString())
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
        skills: JSON.parse(document.data().skills),
        rawData: JSON.parse(document.data().rawData),
        build: JSON.parse(document.data().build),
      };

      const index = jobArray.findIndex((x) => job.jobID === x.jobID);
      const newArray = [...jobArray];
      newArray[index] = newJob;
      updateJobArray(newArray);
      return newJob;
    },
    [isLoggedIn, mainUser]
  );

  return {
    determineUserState,
    addNewJob,
    uploadJob,
    updateMainUserDoc,
    removeJob,
    downloadCharacterJobs,
  };
}
