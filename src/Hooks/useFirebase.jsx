import React, { useCallback, useContext } from "react";
import { IsLoggedInContext, MainUserContext } from "../Context/AuthContext";
import { firestore, functions, performance } from "../firebase";
import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { jobTypes } from "../Components/Job Planner";
import { httpsCallable } from "@firebase/functions";
import { trace } from "firebase/performance";
import { JobArrayContext, JobStatusContext } from "../Context/JobContext";

export function useFirebase() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser } = useContext(MainUserContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { jobStatus } = useContext(JobStatusContext);

  const determineUserState = useCallback(async (user) => {
    if (user.fbToken._tokenResponse.isNewUser) {
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
    if (!user.fbToken._tokenResponse.isNewUser) {
      const CharSnap = await getDoc(
        doc(firestore, "Users", user.CharacterHash)
      );
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
      if (job.jobType === jobTypes.manufacturing) {
        setDoc(
          doc(
            firestore,
            `Users/${mainUser.CharacterHash}/Jobs`,
            job.jobID.toString()
          ),
          {
            jobType: job.jobType,
            name: job.name,
            jobID: job.jobID,
            jobStatus: job.jobStatus,
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
            manufacturing: JSON.stringify(job.manufacturing),
            job: JSON.stringify(job.job),
            planner: JSON.stringify(job.planner),
          }
        );
      }
      if (job.jobType === jobTypes.reaction) {
        setDoc(
          doc(
            firestore,
            `Users/${mainUser.CharacterHash}/Jobs`,
            job.jobID.toString()
          ),
          {
            jobType: job.jobType,
            name: job.name,
            jobID: job.jobID,
            jobStatus: job.jobStatus,
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
            reaction: JSON.stringify(job.reaction),
            job: JSON.stringify(job.job),
            planner: JSON.stringify(job.planner),
          }
        );
      }
    },
    [isLoggedIn, mainUser]
  );

  const uploadJob = useCallback(
    async (job) => {
      if (job.jobType === jobTypes.manufacturing) {
        updateDoc(
          doc(
            firestore,
            `Users/${mainUser.CharacterHash}/Jobs`,
            job.jobID.toString()
          ),
          {
            jobType: job.jobType,
            name: job.name,
            jobID: job.jobID,
            jobStatus: job.jobStatus,
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
            manufacturing: JSON.stringify(job.manufacturing),
            job: JSON.stringify(job.job),
            planner: JSON.stringify(job.planner),
          }
        );
      }
      if (job.jobType === jobTypes.reaction) {
        updateDoc(
          doc(
            firestore,
            `Users/${mainUser.CharacterHash}/Jobs`,
            job.jobID.toString()
          ),
          {
            jobType: job.jobType,
            name: job.name,
            jobID: job.jobID,
            jobStatus: job.jobStatus,
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
            reaction: JSON.stringify(job.reaction),
            job: JSON.stringify(job.job),
            planner: JSON.stringify(job.planner),
          }
        );
      }
    },
    [isLoggedIn, mainUser]
  );

  const updateMainUserDoc = useCallback(
    async () => {
      updateDoc(doc(firestore, "Users", mainUser.CharacterHash), {
        jobStatusArray: jobStatus,
        linkedJobs: mainUser.linkedJobs,
      });
    },
    [isLoggedIn, mainUser]
  );

  const removeJob = useCallback(
    async (job) => {
      deleteDoc(
        doc(
          firestore,
          `Users/${mainUser.CharacterHash}/Jobs`,
          job.jobID.toString()
        )
      );
    },
    [isLoggedIn, mainUser]
  );

  const downloadCharacterJobs = useCallback(
    async (job) => {
      const document = await getDoc(
        doc(
          firestore,
          `Users/${mainUser.CharacterHash}/Jobs`,
          job.jobID.toString()
        )
      );
      let newJob = null;
      if (document.data().jobType === jobTypes.manufacturing) {
        newJob = {
          isSnapshot: false,
          jobType: document.data().jobType,
          name: document.data().name,
          jobID: document.data().jobID,
          jobStatus: document.data().jobStatus,
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
          manufacturing: JSON.parse(document.data().manufacturing),
          job: JSON.parse(document.data().job),
          planner: JSON.parse(document.data().planner),
        };
      }
      if (document.data().jobType === jobTypes.reaction) {
        newJob = {
          isSnapshot: false,
          jobType: document.data().jobType,
          name: document.data().name,
          jobID: document.data().jobID,
          jobStatus: document.data().jobStatus,
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
          reaction: JSON.parse(document.data().reaction),
          job: JSON.parse(document.data().job),
          planner: JSON.parse(document.data().planner),
        };
      }
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
