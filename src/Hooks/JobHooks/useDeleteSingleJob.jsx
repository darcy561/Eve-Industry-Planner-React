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
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import deleteJobFromFirebase from "../../Functions/Firebase/deleteJob";
import uploadJobSnapshotsToFirebase from "../../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";
import getCurrentFirebaseUser from "../../Functions/Firebase/currentFirebaseUser";
import manageListenerRequests from "../../Functions/Firebase/manageListenerRequests";

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
  const { sendSnackbarNotificationError } = useHelperFunction();
  const analytics = getAnalytics();

  const deleteSingleJob = async (inputJobID) => {
    let newApiJobsArary = [...apiJobs];
    let newJobArray = [...jobArray];
    const retrievedJobs = [];
    let newLinkedJobIDs = new Set(linkedJobIDs);
    let newLinkedOrderIDs = new Set(linkedOrderIDs);
    let newLinkedTransIDs = new Set(linkedTransIDs);
    let jobsToSave = new Set();
    let newMutliSelct = new Set([...multiSelectJobPlanner]);

    logEvent(analytics, "DeleteJob", {
      UID: getCurrentFirebaseUser(),
      itemID: inputJobID,
      loggedIn: isLoggedIn,
    });

    let inputJob = await findOrGetJobObject(
      inputJobID,
      jobArray,
      retrievedJobs
    );

    if (!inputJob) {
      updateUserJobSnapshot((prev) =>
        prev.filter((i) => i.jobID !== inputJobID)
      );
      if (isLoggedIn) {
        await uploadJobSnapshotsToFirebase(
          userJobSnapshot.filter((i) => i.jobID !== inputJobID)
        );
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
      for (let jobID of inputJob.build.childJobs[mat.typeID]) {
        let child = await findOrGetJobObject(jobID, jobArray, retrievedJobs);
        if (!child) {
          continue;
        }

        child.parentJob = child.parentJob.filter((i) => i !== inputJob.jobID);

        const matchedSnapshot = userJobSnapshot.find(
          (i) => i.jobID === child.jobID
        );
        matchedSnapshot.setSnapshot(child);

        jobsToSave.add(child.jobID);
      }
    }
    //Removes inputJob IDs from Parent jobs
    for (let parentJobID of inputJob.parentJob) {
      let parentJob = await findOrGetJobObject(
        parentJobID,
        jobArray,
        retrievedJobs
      );
      if (!parentJob || !parentJob.build.childJobs[inputJob.itemID]) {
        continue;
      }

      parentJob.build.childJobs[inputJob.itemID] = parentJob.build.childJobs[
        inputJob.itemID
      ].filter((i) => i !== inputJob.jobID);

      const matchedSnapshot = userJobSnapshot.find(
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

    await removeJobFromGroup(inputJob);

    if (isLoggedIn) {
      for (const jobID of [...jobsToSave]) {
        let job = [...jobArray, ...retrievedJobs].find(
          (i) => i.jobID === jobID
        );
        if (!job) {
          return;
        }
        await updateJobInFirebase(job);
      }
      await uploadJobSnapshotsToFirebase(
        userJobSnapshot.filter((i) => i.jobID !== inputJob.jobID)
      );
      const listener = firebaseListeners.find((i) => i.id === inputJobID);
      if (listener) {
        listener.unsubscribe();
        updateFirebaseListeners((prev) =>
          prev.filter((i) => i.id !== inputJobID)
        );
      }
      await deleteJobFromFirebase(inputJob);
    }

    manageListenerRequests(
      retrievedJobs.filter(({ jobID }) => jobID !== inputJobID),
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );

    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateMultiSelectJobPlanner([...newMutliSelct]);
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      const mergedJobs = [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
      return mergedJobs.filter(({ jobID }) => jobID !== inputJobID);
    });

    updateUserJobSnapshot((prev) => prev.filter((i) => i.jobID !== inputJobID));
    sendSnackbarNotificationError(`${inputJob.name} Deleted`, 3);

    async function removeJobFromGroup(inputJob) {
      if (!inputJob) return;

      if (!inputJob.groupID) return;

      const group = groupArray.find((i) => i.groupID === inputJob.groupID);

      if (!group) return;

      group.removeJobsFromGroup(inputJob, jobArray);
      if (isLoggedIn) {
        await uploadGroupsToFirebase(groupArray);
      }
      updateGroupArray((prev) => [...prev]);
    }
  };

  return { deleteSingleJob };
}
