import { getAnalytics, logEvent } from "firebase/analytics";
import { useContext } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import {
  ApiJobsContext,
  JobArrayContext,
  LinkedIDsContext,
} from "../../Context/JobContext";
import { MultiSelectJobPlannerContext } from "../../Context/LayoutContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import deleteJobFromFirebase from "../../Functions/Firebase/deleteJob";
import uploadJobSnapshotsToFirebase from "../../Functions/Firebase/uploadJobSnapshots";

export function useDeleteSingleJob() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
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
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { findJobData } = useFindJobObject();
  const { findParentUser, sendSnackbarNotificationError } = useHelperFunction();
  const analytics = getAnalytics();
  const parentUser = findParentUser();

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

    if (!inputJob) {
      newUserJobSnapshot = newUserJobSnapshot.filter(
        (i) => i.jobID !== inputJobID
      );

      updateUserJobSnapshot(newUserJobSnapshot);
      if (isLoggedIn) {
        await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      }
      return;
    }

    //Removes apiJob references from users
    inputJob.apiJobs.forEach((job) => {
      newLinkedJobIDs.delete(job);
    });

    //Removes inputJob IDs from child jobs
    for (let mat of inputJob.build.materials) {
      if (!mat) {
        continue;
      }
      for (let job of inputJob.build.childJobs[mat.typeID]) {
        let child = await findJobData(job, newUserJobSnapshot, newJobArray);
        if (!child) {
          continue;
        }

        child.parentJob = child.parentJob.filter((i) => i !== inputJob.jobID);

        const matchedSnapshot = newUserJobSnapshot.find(
          (i) => i.jobID === child.jobID
        );
        matchedSnapshot.setSnapshot(child);

        jobsToSave.add(child.jobID);
      }
    }
    //Removes inputJob IDs from Parent jobs
    for (let parentJobID of inputJob.parentJob) {
      let parentJob = await findJobData(
        parentJobID,
        newUserJobSnapshot,
        newJobArray
      );
      if (!parentJob || !parentJob.build.childJobs[inputJob.itemID]) {
        continue;
      }

      parentJob.build.childJobs[inputJob.itemID] = parentJob.build.childJobs[
        inputJob.itemID
      ].filter((i) => i !== inputJob.jobID);

      const matchedSnapshot = newUserJobSnapshot.find(
        (i) => i.jobID === parentJob.jobID
      );
      matchedSnapshot.setSnapshot(parentJob);

      jobsToSave.add(parentJob.jobID);
    }

    inputJob.build.sale.transactions.forEach((trans) => {
      newLinkedTransIDs.delete(trans.transaction_id);
    });

    inputJob.build.sale.marketOrders.forEach((order) => {
      newLinkedOrderIDs.delete(order.order_id);
    });

    newMutliSelct.delete(inputJob.jobID);

    newUserJobSnapshot = newUserJobSnapshot.filter(
      (i) => i.jobID !== inputJob.jobID
    );

    newJobArray = newJobArray.filter((job) => job.jobID !== inputJob.jobID);

    await removeJobFromGroup(inputJob);

    if (isLoggedIn) {
      for (const jobID of [...jobsToSave]) {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) {
          return;
        }
        await updateJobInFirebase(job);
      }
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      const listener = firebaseListeners.find((i) => i.id === inputJobID);
      if (listener) {
        listener.unsubscribe();
        updateFirebaseListeners((prev) =>
          prev.filter((i) => i.id !== inputJobID)
        );
      }
      await deleteJobFromFirebase(inputJob);
    }

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateMultiSelectJobPlanner([...newMutliSelct]);
    updateJobArray(newJobArray);

    updateUserJobSnapshot(newUserJobSnapshot);
    sendSnackbarNotificationError(`${inputJob.name} Deleted`, 3);

    async function removeJobFromGroup(inputJob) {
      if (!inputJob) return;

      if (!inputJob.groupID) return;

      const newGroupArray = [...groupArray];
      const group = newGroupArray.find((i) => i.groupID === inputJob.groupID);

      if (!group) return newGroupArray;

      group.removeJobsFromGroup(inputJob, newJobArray);
      if (isLoggedIn) {
        await uploadGroupsToFirebase(newGroupArray);
      }
      updateGroupArray(newGroupArray);
    }
  };

  return { deleteSingleJob };
}
