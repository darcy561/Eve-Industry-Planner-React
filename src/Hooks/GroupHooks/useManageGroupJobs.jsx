import { useContext } from "react";
import { JobArrayContext } from "../../Context/JobContext";

export function useManageGroupJobs() {
  const { jobArray, groupArray } = useContext(JobArrayContext);

  function findMaterialJobIDInGroup(requestedMaterialID, requestedGroupID) {
    if (!requestedMaterialID || !requestedGroupID) return null;

    const requestedGroupObject = groupArray.find(
      (i) => i.groupID === requestedGroupID
    );

    if (!requestedGroupObject.includedTypeIDs.has(requestedMaterialID))
      return null;

    return (
      jobArray.find(
        (i) =>
          i.groupID === requestedGroupID && i.itemID === requestedMaterialID
      )?.jobID || null
    );
  }

  return {
    findMaterialJobIDInGroup,
  };
}
