import { getAnalytics, logEvent } from "firebase/analytics";
import { useContext } from "react";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../Context/JobContext";
import {
  MultiSelectJobPlannerContext,
  SnackBarDataContext,
} from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";

const useDeleteSingleJob = async (inputJobID) => {
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
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
  const { removeJob, uploadJob, uploadUserJobSnapshot } = useFirebase();

  const analytics = getAnalytics();
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

  let inputJob = await findJobData(inputJobID, newUserJobSnapshot, newJobArray);

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

  if (inputJob.groupID !== null) {
    // await useRemoveJobFromGroup(inputJob.jobID, inputJob.groupID, newJobArray);
  }

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
};
export default useDeleteSingleJob;
