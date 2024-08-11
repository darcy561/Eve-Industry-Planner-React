import { useContext } from "react";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { JobArrayContext } from "../../Context/JobContext";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import uploadJobSnapshotsToFirebase from "../../Functions/Firebase/uploadJobSnapshots";

export function useMoveItemsOnPlanner() {
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );

  async function moveItemsOnPlanner(inputSnapIDs, direction) {
    const retrievedJobs = [];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let groupsModified = false;
    let jobsModified = false;

    if (!direction) return;

    for (let inputSnapID of inputSnapIDs) {
      if (inputSnapID.includes("group")) {
        const selectedGroup = newGroupArray.find(
          (i) => i.groupID === inputSnapID
        );
        selectedGroup.updateGroupStatus(direction);
        groupsModified = true;
      } else {
        await moveJobs(inputSnapID);
      }
    }

    if (isLoggedIn) {
      if (jobsModified) {
        await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
      }
      if (groupsModified) {
        await uploadGroupsToFirebase(newGroupArray);
      }
    }
    if (jobsModified) {
      manageListenerRequests(
        retrievedJobs,
        updateJobArray,
        updateFirebaseListeners,
        firebaseListeners,
        isLoggedIn
      );
      updateUserJobSnapshot(newUserJobSnapshot);
      updateJobArray((prev) => {
        const existingIDs = new Set(prev.map(({ jobID }) => jobID));
        return [
          ...prev,
          ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
        ];
      });
    }
    if (groupsModified) {
      updateGroupArray(newGroupArray);
    }

    async function moveJobs(inputJobID) {
      let inputJob = await findOrGetJobObject(
        inputJobID,
        jobArray,
        retrievedJobs
      );
      if (!inputJob) return;

      if (direction === "forward") {
        if (inputJob.jobStatus >= 4) return;
        if (inputJob.groupID !== null && inputJob.jobStatus >= 3) return;
        inputJob.stepForward();
      }
      if (direction === "backward") {
        if (inputJob.jobStatus === 0) return;
        inputJob.stepBackward();
      }

      if (!inputJob.groupID) {
        const matchedSnapshot = newUserJobSnapshot.find(
          (i) => i.jobID === inputJob.jobID
        );
        matchedSnapshot.setSnapshot(inputJob);
      }
      jobsModified = true;
      if (isLoggedIn) {
        await updateJobInFirebase(inputJob);
      }

      return;
    }
  }

  return {
    moveItemsOnPlanner,
  };
}
