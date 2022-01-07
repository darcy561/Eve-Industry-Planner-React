import { useCallback, useContext } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../Context/AuthContext";
import { firestore, functions, performance } from "../firebase";
import { doc, deleteDoc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { JobArrayContext, JobStatusContext } from "../Context/JobContext";

export function useFirebase() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);

  const parentUser = users.find((i) => i.ParentUser === true);


  const checkFBToken = async () => {
    
  }

  const determineUserState = async (user, fbToken) => {
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
          linkedOrders: charData.data.linkedOrders,
          linkedTrans: charData.data.linkedTrans,
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
  };

  const addNewJob = useCallback(
    async (job) => {
      setDoc(
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
        }
      );
    },
    [isLoggedIn, users]
  );

  const uploadJob = useCallback(
    async (job) => {
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
        }
      );
    },
    [isLoggedIn, users]
  );

  const updateMainUserDoc = useCallback(async () => {
    updateDoc(doc(firestore, "Users", parentUser.accountID), {
      jobStatusArray: jobStatus,
      linkedJobs: parentUser.linkedJobs,
      linkedTrans: parentUser.linkedTrans,
      linkedOrders: parentUser.linkedOrders,
    });
  }, [isLoggedIn, users]);

  const removeJob = useCallback(
    async (job) => {
      const parentUser = users.find((i) => i.ParentUser === true);
      deleteDoc(
        doc(
          firestore,
          `Users/${parentUser.accountID}/Jobs`,
          job.jobID.toString()
        )
      );
    },
    [isLoggedIn, users]
  );

  const downloadCharacterJobs = useCallback(
    async (job) => {
      const document = await getDoc(
        doc(
          firestore,
          `Users/${parentUser.accountID}/Jobs`,
          job.jobID.toString()
        )
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
      };

      const index = jobArray.findIndex((x) => job.jobID === x.jobID);
      const newArray = [...jobArray];
      newArray[index] = newJob;
      updateJobArray(newArray);
      return newJob;
    },
    [isLoggedIn, users]
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
