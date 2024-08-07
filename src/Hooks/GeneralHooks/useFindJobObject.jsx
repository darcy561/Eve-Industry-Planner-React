import { useContext } from "react";
import { IsLoggedInContext } from "../../Context/AuthContext";
import getJobDocumentFromFirebase from "../../Functions/Firebase/getJobDocument";

export function useFindJobObject() {
  const { isLoggedIn } = useContext(IsLoggedInContext);

  const findJobData = async (
    inputJobID,
    chosenSnapshotArray,
    chosenJobArray,
    chosenGroupArray,
    returnRequest
  ) => {
    if (inputJobID.includes("group")) {
      return findGroupObject(inputJobID, chosenGroupArray);
    } else {
      return await findJobObject();
    }

    async function findJobObject() {
      let jobSnapshot = chosenSnapshotArray.find((i) => i.jobID === inputJobID);
      let foundJob = chosenJobArray.find((i) => i.jobID === inputJobID);

      switch (returnRequest) {
        case "snapshot":
          return jobSnapshot;
        case "groupJob":
          if (!foundJob && isLoggedIn) {
            foundJob = await getJobDocumentFromFirebase(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return foundJob;
        case "all":
          if (!foundJob && jobSnapshot && isLoggedIn) {
            foundJob = await getJobDocumentFromFirebase(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return [foundJob, jobSnapshot];
        case "none":
          if (!foundJob && isLoggedIn) {
            foundJob = await getJobDocumentFromFirebase(inputJobID);
            if (!foundJob) {
              return undefined;
            }
            chosenJobArray.push();
          }
          return null;
        default:
          if (!foundJob && jobSnapshot && isLoggedIn) {
            foundJob = await getJobDocumentFromFirebase(inputJobID);
            if (!foundJob) return undefined;
            chosenJobArray.push(foundJob);
          }
          return foundJob;
      }
    }
  };

  function findGroupObject(inputJobID, inputGroupArray) {
    if (!inputJobID || !inputGroupArray) return null;
    return inputGroupArray.find((i) => i.groupID === inputJobID);
  }

  return {
    findJobData,
  };
}
