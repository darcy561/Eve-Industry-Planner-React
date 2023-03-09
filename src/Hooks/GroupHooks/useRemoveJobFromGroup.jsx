import { useContext } from "react";
import { JobArrayContext } from "../../Context/JobContext";
import { useGroupManagement } from "../useGroupManagement";
import { useJobManagement } from "../useJobManagement";

export async function useRemoveJobFromGroup(
  jobIDtoRemove,
  selectedGroupID,
  chosenJobArray
) {
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { findJobData } = useJobManagement();
  const { findGroupData } = useGroupManagement();

  if (
    jobIDtoRemove === undefined ||
    selectedGroupID === undefined ||
    selectedGroupID === null ||
    chosenJobArray === undefined
  )
    return;
  let newGroupArray = [...groupArray];
  let newIncludedJobIDs = new Set();
  let newIncludedTypeIDs = new Set();
  let newMaterialIDs = new Set();
  let newOutputJobCount = 0;

  let selectedGroup = findGroupData(selectedGroupID, newGroupArray);
  if (selectedGroup === undefined) return;

  for (let jobID of selectedGroup.includedJobIDs) {
    await findJobData(jobID, undefined, chosenJobArray, "groupJob");
  }

  for (let jobID of selectedGroup.includedJobIDs) {
    if (jobID === jobIDtoRemove) continue;

    let foundJob = chosenJobArray.find((i) => i.jobID === jobID);
    if (foundJob === undefined) continue;

    if (job.parentJob.length === 0) {
      newOutputJobCount++;
    }
    newMaterialIDs.add(foundJob.itemID);
    foundJob.build.materials.forEach((mat) => {
      newMaterialIDs.add(mat.typeID);
    });
    newIncludedTypeIDs.add(job.itemID);
    newIncludedJobIDs.add(job.jobID);
  }

  selectedGroup.includedJobIDs = [...newIncludedJobIDs];
  selectedGroup.includedTypeIDs = [...newIncludedTypeIDs];
  selectedGroup.newMaterialIDs = [...newMaterialIDs];
  selectedGroup.outputJobCount = newOutputJobCount;
  updateGroupArray(newGroupArray);
}
