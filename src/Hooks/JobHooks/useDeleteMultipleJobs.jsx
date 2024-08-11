import { getAnalytics, logEvent } from "firebase/analytics";
import { trace } from "firebase/performance";
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
import { performance } from "../../firebase";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import deleteJobFromFirebase from "../../Functions/Firebase/deleteJob";
import uploadJobSnapshotsToFirebase from "../../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";
import manageListenerRequests from "../../Functions/Firebase/manageListenerRequests";

export function useDeleteMultipleJobs() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
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
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { findParentUser, sendSnackbarNotificationError } = useHelperFunction();

  const analytics = getAnalytics();
  const parentUser = findParentUser();

  const deleteMultipleJobs = async (inputJobIDs) => {
    const r = trace(performance, "massDeleteProcess");
    r.start();
    let newApiJobsArary = [...apiJobs];
    const retrievedJobs = [];
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
      let inputJob = await findOrGetJobObject(
        inputJobID,
        jobArray,
        retrievedJobs
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
          let child = await findOrGetJobObject(jobID, jobArray, retrievedJobs);

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
          let parentJob = await findOrGetJobObject(
            parentJobID,
            jobArray,
            retrievedJobs
          );

          if (!parentJob || !parentJob.build.childJobs[inputJob.itemID]) {
            continue;
          }

          parentJob.build.childJobs[inputJob.itemID] =
            parentJob.build.childJobs[inputJob.itemID].filter(
              (i) => inputJob.jobID !== i
            );

          const matchedSnapshot = userJobSnapshot.find(
            (i) => i.jobID === parentJob.jobID
          );
          matchedSnapshot.setSnapshot(parentJob);

          jobsToSave.add(parentJob.jobID);
        }
      }

      removeJobFromGroup(inputJob);

      if (isLoggedIn) {
        const listener = firebaseListeners.find((i) => i.id === inputJob.jobID);
        if (listener) {
          listener.unsubscribe();
        }
        await deleteJobFromFirebase(inputJob);
      }
    }

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

      await uploadGroupsToFirebase(newGroupArray);
      await uploadJobSnapshotsToFirebase(
        userJobSnapshot.filter((i) => !inputJobIDs.includes(i.jobID))
      );
    }
    manageListenerRequests(
      retrievedJobs.filter(({ id }) => !inputJobIDs.includes(id)),
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );

    updateFirebaseListeners((prev) =>
      prev.filter(({ id }) => !inputJobIDs.includes(id))
    );
    updateLinkedJobIDs([...newLinkedJobIDs]);
    updateLinkedOrderIDs([...newLinkedOrderIDs]);
    updateLinkedTransIDs([...newLinkedTransIDs]);
    updateApiJobs(newApiJobsArary);
    updateGroupArray(newGroupArray);

    updateUserJobSnapshot((prev) =>
      prev.filter((i) => !inputJobIDs.includes(i.jobID))
    );
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      const mergedJobs = [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
      return mergedJobs.filter((i) => !inputJobIDs.includes(i.jobID));
    });
    updateMultiSelectJobPlanner([...newMutliSelct]);
    sendSnackbarNotificationError(`${inputJobIDs.length} Job/Jobs Deleted`, 3);
    r.stop();

    function removeJobFromGroup(inputJob) {
      if (!inputJob) return newGroupArray;

      if (!inputJob.groupID) return;

      const group = newGroupArray.find((i) => i.groupID === inputJob.groupID);

      if (!group) return newGroupArray;

      group.removeJobsFromGroup(inputJob, [...jobArray, ...retrievedJobs]);
    }
  };
  return { deleteMultipleJobs };
}
