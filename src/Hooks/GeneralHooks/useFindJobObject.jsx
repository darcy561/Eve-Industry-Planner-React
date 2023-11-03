import { useFirebase } from "../useFirebase";

export function useFindJobObject() {
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
      return chosenGroupArray.find((i) => i.groupID === inputJobID);
    }

    async function findJobObject() {
      let jobSnapshot = chosenSnapshotArray.find((i) => i.jobID === inputJobID);
      let foundJob = chosenJobArray.find((i) => i.jobID === inputJobID);

      switch (returnRequest) {
        case "snapshot":
          return jobSnapshot;
        case "groupJob":
          if (!foundJob) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return foundJob;
        case "all":
          if (!foundJob && jobSnapshot) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return [foundJob, jobSnapshot];
        case "none":
          if (!foundJob) {
            foundJob = await downloadCharacterJobs(inputJobID);
            if (!foundJob) {
              return undefined;
            }
            chosenJobArray.push();
          }
          return null;
        default:
          if (!foundJob && jobSnapshot) {
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
