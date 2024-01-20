import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { JobArrayContext } from "../../Context/JobContext";
import { useFirebase } from "../useFirebase";
import { useFindJobObject } from "./useFindJobObject";
import { useJobSnapshotManagement } from "../JobHooks/useJobSnapshots";

export function useMoveItemsOnPlanner() {
  const { jobArray, updateJobArray, groupArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updateJobSnapshot } = useJobSnapshotManagement();
  const { uploadGroups, uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { findJobData } = useFindJobObject();

  const moveItemsOnPlanner = async (inputSnapIDs, direction) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let groupsModified = false;
    let jobsModified = false;

    if (!direction) return;

    for (let inputSnapID of inputSnapIDs) {
      if (inputSnapID.includes("group")) {
        await moveGroups(inputSnapID);
      } else {
        await moveJobs(inputSnapID);
      }
    }

    if (isLoggedIn) {
      if (jobsModified) {
        uploadUserJobSnapshot(newUserJobSnapshot);
      }
      if (groupsModified) {
        uploadGroups(newGroupArray);
      }
    }
    if (jobsModified) {
      updateUserJobSnapshot(newUserJobSnapshot);
      updateJobArray(newJobArray);
    }
    if (groupsModified) {
      updateGroupArray(newGroupArray);
    }

    async function moveGroups(inputID) {
      let inputGroup = await findJobData(
        inputID,
        undefined,
        undefined,
        newGroupArray
      );

      if (!inputGroup) return;

      if (direction === "forward") {
        if (inputGroup.groupStatus >= 3) return;
        inputGroup.groupStatus++;
      }
      if (direction === "backward") {
        if (inputGroup.groupStatus === 0) return;
        inputGroup.groupStatus--;
      }

      newGroupArray = newGroupArray.filter((i) => i.groupID !== inputID);
      newGroupArray.push(inputGroup);
      groupsModified = true;
      return;
    }

    async function moveJobs(inputSnapID) {
      let inputJob = await findJobData(
        inputSnapID,
        newUserJobSnapshot,
        newJobArray
      );
      if (!inputJob) return;

      if (direction === "forward") {
        if (inputJob.jobStatus >= 4) return;
        if (inputJob.groupID !== null && inputJob.jobStatus >= 3) return;
        inputJob.jobStatus++;
      }
      if (direction === "backward") {
        if (inputJob.jobStatus === 0) return;
        inputJob.jobStatus--;
      }

      if (!inputJob.groupID) {
        newUserJobSnapshot = updateJobSnapshot(
          inputJob,
          newUserJobSnapshot
        );
      }
      jobsModified = true;
      if (isLoggedIn) {
        uploadJob(inputJob);
      }

      return;
    }
  };

  return {
    moveItemsOnPlanner,
  };
}
