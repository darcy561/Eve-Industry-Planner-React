import { useContext } from "react";
import { ActiveJobContext } from "../../Context/JobContext";
import { useFirebase } from "../useFirebase";

export function useFindJobObject() {
  const { activeJob, activeGroup } = useContext(ActiveJobContext);
  const { downloadCharacterJobs } = useFirebase();

  const findJobData = async (
    inputJobID,
    chosenSnapshotArray,
    chosenJobArray,
    chosenGroupArray,
    returnRequest
  ) => {
    if (inputJobID.includes("group")) {
      return findGroupObject();
    } else {
      return await findJobObject();
    }

    function findGroupObject() {
      let foundGroup = chosenGroupArray.find((i) => i.groupID === inputJobID);

      if (activeGroup !== null && activeGroup.groupID === inputJobID) {
        foundGroup = { ...activeGroup };
      }
      return foundGroup;
    }

    async function findJobObject() {
      let jobSnapshot = chosenSnapshotArray.find((i) => i.jobID === inputJobID);
      let foundJob = chosenJobArray.find((i) => i.jobID === inputJobID);
      if (activeJob.jobID === inputJobID) {
        foundJob = activeJob;
      }
      switch (returnRequest) {
        case "snapshot":
          return jobSnapshot;
        case "groupJob":
          if (foundJob === undefined) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return foundJob;
        case "all":
          if (foundJob === undefined && jobSnapshot !== undefined) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return [foundJob, jobSnapshot];
        case "none":
          if (foundJob === undefined) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) {
              return undefined;
            }
            chosenJobArray.push();
          }
          return null;
        default:
          if (foundJob === undefined && jobSnapshot !== undefined) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return foundJob;
      }
    }
  };

  return {
    findJobData,
  };
}
