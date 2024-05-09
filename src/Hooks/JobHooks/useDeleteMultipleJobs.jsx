import { getAnalytics, logEvent } from "firebase/analytics";
import { trace } from "firebase/performance";
import { useContext, useMemo } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../Context/JobContext";
import {
  MultiSelectJobPlannerContext,
  SnackBarDataContext,
} from "../../Context/LayoutContext";
import { performance } from "../../firebase";
import { useFirebase } from "../useFirebase";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useJobSnapshotManagement } from "./useJobSnapshots";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";

export function useDeleteMultipleJobs() {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const {
    linkedJobIDs,
    updateLinkedJobIDs,
    linkedOrderIDs,
    updateLinkedOrderIDs,
    linkedTransIDs,
    updateLinkedTransIDs,
  } = useContext(LinkedIDsContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { deleteJobSnapshot, updateJobSnapshot } = useJobSnapshotManagement();
  const { findJobData } = useFindJobObject();
  const { removeJob, uploadJob, uploadGroups, uploadUserJobSnapshot } =
    useFirebase();
  const { findParentUser, sendSnackbarNotificationError } = useHelperFunction();

  const analytics = getAnalytics();
  const parentUser = findParentUser();

  const deleteMultipleJobs = async (inputJobIDs) => {
    const r = trace(performance, "massDeleteProcess");
    r.start();
    let newApiJobsArary = [...apiJobs];
    let newJobArray = [...jobArray];
    let newGroupArray = [...groupArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);
    let jobsToSave = new Set();
    let newMutliSelct = new Set([...multiSelectJobPlanner]);

    logEvent(analytics, "Mass Delete", {
      UID: parentUser.accountID,
      buildCount: inputJobIDs.length,
      loggedIn: isLoggedIn,
    });

    for (let inputJobID of inputJobIDs) {
      let inputJob = await findJobData(
        inputJobID,
        newUserJobSnapshot,
        newJobArray
      );

      if (!inputJob) {
        continue;
      }
      inputJob.apiJobs.forEach((job) => {
        newLinkedJobIDs.delete(job);
      });

      inputJob.build.sale.transactions.forEach((trans) => {
        newLinkedTransIDs.delete(trans.order_id);
      });

      inputJob.build.sale.marketOrders.forEach((order) => {
        newLinkedOrderIDs.delete(order.order_id);
      });

      newMutliSelct.delete(inputJob.jobID);

      //Removes inputJob IDs from child jobs
      for (let mat of inputJob.build.materials) {
        if (!mat) {
          continue;
        }
        for (let jobID of inputJob.build.childJobs[mat.typeID]) {
          if (inputJobIDs.includes(jobID)) continue;
          let child = await findJobData(jobID, newUserJobSnapshot, newJobArray);

          if (!child) {
            continue;
          }
          child.parentJob = child.parentJob.filter((i) => inputJob.jobID !== i);

          jobsToSave.add(child.jobID);
        }
      }
      //Removes inputJob IDs from Parent jobs
      if (inputJob.parentJob !== null) {
        for (let parentJobID of inputJob.parentJob) {
          if (inputJobIDs.includes(parentJobID)) continue;
          let parentJob = await findJobData(
            parentJobID,
            newUserJobSnapshot,
            newJobArray
          );

          if (!parentJob || !parentJob.build.childJobs[inputJob.itemID]) {
            continue;
          }

          parentJob.build.childJobs[inputJob.itemID] =
            parentJob.build.childJobs[inputJob.itemID].filter(
              (i) => inputJob.jobID !== i
            );

          newUserJobSnapshot = updateJobSnapshot(parentJob, newUserJobSnapshot);
          jobsToSave.add(parentJob.jobID);
        }
      }

      newGroupArray = removeJobFromGroup(newGroupArray, inputJob);

      newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

      if (isLoggedIn) {
        removeJob(inputJob);
      }
    }

    newJobArray = newJobArray.filter((i) => !inputJobIDs.includes(i.jobID));

    if (isLoggedIn) {
      jobsToSave.forEach((jobID) => {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) {
          return;
        }
        uploadJob(job);
      });

      uploadGroups(newGroupArray);
      uploadUserJobSnapshot(newUserJobSnapshot);
    }

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateUserJobSnapshot(newUserJobSnapshot);

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateMultiSelectJobPlanner([...newMutliSelct]);
    sendSnackbarNotificationError(`${inputJobIDs.length} Job/Jobs Deleted`, 3);
    r.stop();

    function removeJobFromGroup(newGroupArray, inputJob) {
      if (!inputJob) return newGroupArray;

      if (!inputJob.groupID) return newGroupArray;

      const selectedGroupIndex = newGroupArray.findIndex(
        (i) => i.groupID === inputJob.groupID
      );

      if (selectedGroupIndex === -1) return newGroupArray;

      const groupJobs = newJobArray.filter(
        (job) => job.groupID === activeGroup && job.jobID !== inputJob.jobID
      );

      const {
        outputJobCount,
        materialIDs,
        jobTypeIDs,
        includedJobIDs,
        linkedJobIDs,
        linkedTransIDs,
        linkedOrderIDs,
      } = groupJobs.reduce(
        (prev, job) => {
          if (job.parentJob.length === 0) {
            prev.outputJobCount++;
          }
          prev.materialIDs.add(job.itemID);
          prev.jobTypeIDs.add(job.itemID);
          prev.includedJobIDs.add(job.jobID);
          prev.linkedJobIDs = new Set([...prev.linkedJobIDs, ...job.apiJobs]);
          prev.linkedOrderIDs = new Set([
            ...prev.linkedOrderIDs,
            ...job.apiOrders,
          ]);
          prev.linkedTransIDs = new Set([
            ...prev.linkedTransIDs,
            ...job.apiTransactions,
          ]);

          job.build.materials.forEach((mat) => {
            prev.materialIDs.add(mat.typeID);
          });
          return prev;
        },
        {
          outputJobCount: 0,
          materialIDs: new Set(),
          jobTypeIDs: new Set(),
          includedJobIDs: new Set(),
          linkedJobIDs: new Set(),
          linkedTransIDs: new Set(),
          linkedOrderIDs: new Set(),
        }
      );

      newGroupArray[selectedGroupIndex].includedJobIDs = [...includedJobIDs];
      newGroupArray[selectedGroupIndex].includedTypeIDs = [...jobTypeIDs];
      newGroupArray[selectedGroupIndex].materialIDs = [...materialIDs];
      newGroupArray[selectedGroupIndex].outputJobCount = outputJobCount;
      newGroupArray[selectedGroupIndex].linkedJobIDs = [...linkedJobIDs];
      newGroupArray[selectedGroupIndex].linkedOrderIDs = [...linkedOrderIDs];
      newGroupArray[selectedGroupIndex].linkedTransIDs = [...linkedTransIDs];

      return newGroupArray;
    }
  };
  return { deleteMultipleJobs };
}
