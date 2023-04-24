import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import {
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
} from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";

export function useCloseGroup() {
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { uploadGroups } = useFirebase();

  const closeGroup = (groupJobs) => {
    let newGroupArray = [...groupArray];
    let newGroupEntry = { ...activeGroup };
    let outputJobCount = 0;
    let materialIDs = new Set();
    let jobTypeIDs = new Set();
    let includedJobIDs = new Set();
    for (let job of groupJobs) {
      if (job.parentJob.length === 0) {
        outputJobCount++;
      }

      materialIDs.add(job.itemID);
      job.build.materials.forEach((mat) => {
        materialIDs.add(mat.typeID);
      });
      jobTypeIDs.add(job.itemID);
      includedJobIDs.add(job.jobID);
    }
    newGroupEntry.includedJobIDs = [...includedJobIDs];
    newGroupEntry.includedTypeIDs = [...jobTypeIDs];
    newGroupEntry.materialIDs = [...materialIDs];
    newGroupEntry.outputJobCount = outputJobCount;

    let index = newGroupArray.findIndex(
      (i) => i.groupID === activeGroup.groupID
    );

    if (index !== -1) {
      newGroupArray[index] = newGroupEntry;
    } else {
      newGroupArray.push(newGroupEntry);
    }
    updateActiveGroup(null);
    updateGroupArray(newGroupArray);
    updateMultiSelectJobPlanner([]);
    updateEditGroupTrigger((prev) => !prev);
    uploadGroups(newGroupArray);
  };

  return { closeGroup };
}
