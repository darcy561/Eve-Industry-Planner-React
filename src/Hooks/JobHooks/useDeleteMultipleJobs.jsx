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
import { useJobManagement } from "../useJobManagement";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";

export function useDeleteMultipleJobs() {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
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
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { deleteJobSnapshot, updateJobSnapshotFromFullJob } =
    useJobManagement();
  const { findJobData } = useFindJobObject();
  const { removeJob, uploadJob, uploadGroups, uploadUserJobSnapshot } =
    useFirebase();

  const analytics = getAnalytics();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

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

      if (inputJob === undefined) {
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
        if (mat === null) {
          continue;
        }
        for (let jobID of mat.childJob) {
          let child = await findJobData(jobID, newUserJobSnapshot, newJobArray);

          if (child === undefined) {
            continue;
          }
          child.parentJob = child.parentJob.filter((i) => inputJob.jobID !== i);

          jobsToSave.add(child.jobID);
        }
      }
      //Removes inputJob IDs from Parent jobs
      if (inputJob.parentJob !== null) {
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
            mat.childJob = mat.childJob.filter((i) => inputJob.jobID !== i);
          }
          newUserJobSnapshot = updateJobSnapshotFromFullJob(
            parentJob,
            newUserJobSnapshot
          );
          jobsToSave.add(parentJob.jobID);
        }
      }

      removeJobFromGroup: if (inputJob.groupID !== null) {
        let newIncludedJobIDs = new Set();
        let newIncludedTypeIDs = new Set();
        let newMaterialIDs = new Set();
        let newOutputJobCount = 0;
        const selectedGroupIndex = newGroupArray.findIndex(
          (i) => i.groupID === inputJob.groupID
        );
        const isActiveGroup =
          newGroupArray[selectedGroupIndex].groupID === activeGroup.groupID;

        if (selectedGroupIndex === -1) break removeJobFromGroup;

        for (let jobID of newGroupArray[selectedGroupIndex].includedJobIDs) {
          if (jobID === inputJob.jobID) continue;

          let foundJob = await findJobData(
            jobID,
            newUserJobSnapshot,
            newJobArray,
            undefined,
            "groupJob"
          );
          if (foundJob === undefined) continue;

          if (foundJob.parentJob.length === 0) {
            newOutputJobCount++;
          }
          newMaterialIDs.add(foundJob.itemID);
          foundJob.build.materials.forEach((mat) => {
            newMaterialIDs.add(mat.typeID);
          });
          newIncludedTypeIDs.add(foundJob.itemID);
          newIncludedJobIDs.add(foundJob.jobID);
        }

        newGroupArray[selectedGroupIndex].includedJobIDs = [
          ...newIncludedJobIDs,
        ];
        newGroupArray[selectedGroupIndex].includedTypeIDs = [
          ...newIncludedTypeIDs,
        ];
        newGroupArray[selectedGroupIndex].materialIDs = [...newMaterialIDs];
        newGroupArray[selectedGroupIndex].outputJobCount = newOutputJobCount;
        if (isActiveGroup) {
          updateActiveGroup(newGroupArray[selectedGroupIndex]);
        }

        updateGroupArray(newGroupArray);
        if (isLoggedIn) {
          uploadGroups(newGroupArray);
        }
      }

      newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

      if (isLoggedIn) {
        removeJob(inputJob);
      }
    }

    newJobArray = newJobArray.filter((i) => !inputJobIDs.includes(i.jobID));

    if (isLoggedIn) {
      jobsToSave.forEach((jobID) => {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (job === undefined) {
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

    updateJobArray(newJobArray);
    updateMultiSelectJobPlanner([...newMutliSelct]);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${inputJobIDs.length} Job/Jobs Deleted`,
      severity: "error",
      autoHideDuration: 3000,
    }));
    r.stop();

    async function removeJobsFromGroup() {
      if(input) return
    }
  };
  return { deleteMultipleJobs };
}
