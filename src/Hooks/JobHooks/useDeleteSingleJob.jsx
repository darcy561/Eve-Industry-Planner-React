import { getAnalytics, logEvent } from "firebase/analytics";
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
import { useFirebase } from "../useFirebase";
import { useJobManagement } from "../useJobManagement";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";

export function useDeleteSingleJob() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
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
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { removeJob, uploadJob, uploadGroups, uploadUserJobSnapshot } =
    useFirebase();
  const { deleteJobSnapshot, updateJobSnapshotFromFullJob } =
    useJobManagement();
  const { findJobData } = useFindJobObject();
  const analytics = getAnalytics();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const deleteSingleJob = async (inputJobID) => {
    let newApiJobsArary = [...apiJobs];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newJobArray = [...jobArray];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);
    let jobsToSave = new Set();
    let newMutliSelct = new Set([...multiSelectJobPlanner]);

    logEvent(analytics, "DeleteJob", {
      UID: parentUser.accountID,
      itemID: inputJobID,
      loggedIn: isLoggedIn,
    });

    let inputJob = await findJobData(
      inputJobID,
      newUserJobSnapshot,
      newJobArray
    );

    if (inputJob === undefined) {
      newUserJobSnapshot = newUserJobSnapshot.filter(
        (i) => i.jobID !== inputJobID
      );

      updateUserJobSnapshot(newUserJobSnapshot);
      if (isLoggedIn) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      return;
    }

    //Removes apiJob references from users
    inputJob.apiJobs.forEach((job) => {
      newLinkedJobIDs.delete(job);
    });

    //Removes inputJob IDs from child jobs
    for (let mat of inputJob.build.materials) {
      if (mat !== null) {
        for (let job of mat.childJob) {
          let child = await findJobData(job, newUserJobSnapshot, newJobArray);
          if (child === undefined) {
            continue;
          }

          child.parentJob = child.parentJob.filter((i) => i !== inputJob.jobID);

          newUserJobSnapshot = updateJobSnapshotFromFullJob(
            child,
            newUserJobSnapshot
          );

          jobsToSave.add(child.jobID);
        }
      }
    }
    //Removes inputJob IDs from Parent jobs
    for (let parentJobID of inputJob.parentJob) {
      let parentJob = await findJobData(
        parentJobID,
        newUserJobSnapshot,
        newJobArray
      );
      if (parentJob === undefined) {
        continue;
      }
      for (let mat of parentJob.build.materials) {
        if (mat.childJob === undefined) {
          continue;
        }
        mat.childJob = mat.childJob.filter((i) => i !== inputJob.jobID);
      }
      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        parentJob,
        newUserJobSnapshot
      );
      jobsToSave.add(parentJob.jobID);
    }

    inputJob.build.sale.transactions.forEach((trans) => {
      newLinkedTransIDs.delete(trans.transaction_id);
    });

    inputJob.build.sale.marketOrders.forEach((order) => {
      newLinkedOrderIDs.delete(order.order_id);
    });

    newMutliSelct.delete(inputJob.jobID);

    newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

    newJobArray = newJobArray.filter((job) => job.jobID !== inputJob.jobID);

    await removeJobFromGroup();

    if (isLoggedIn) {
      jobsToSave.forEach((jobID) => {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (job === undefined) {
          return;
        }
        uploadJob(job);
      });
      uploadUserJobSnapshot(newUserJobSnapshot);
      removeJob(inputJob);
    }

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateMultiSelectJobPlanner([...newMutliSelct]);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJob.name} Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));

    async function removeJobFromGroup() {
      if (!inputJob.groupID) return;
      
      let newGroupArray = [...groupArray];

      const selectedGroupIndex = newGroupArray.findIndex(
        (i) => i.groupID === inputJob.groupID
      );
      const groupJobs = newJobArray.filter(
        (job) =>
          job.groupID === activeGroup.groupID && job.jobID !== inputJob.jobID
      );
      const isActiveGroup =
        newGroupArray[selectedGroupIndex].groupID === activeGroup.groupID;

      if (selectedGroupIndex === -1) return;

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

      updateGroupArray(newGroupArray);
      if (isActiveGroup) {
        updateActiveGroup(newGroupArray[selectedGroupIndex]);
      }
      if (isLoggedIn) {
        uploadGroups(newGroupArray);
      }
    }
  };

  return { deleteSingleJob };
}
