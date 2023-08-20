import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import {
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
} from "../../Context/LayoutContext";
import { useFirebase } from "../useFirebase";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { useJobSnapshotManagement } from "../JobHooks/useJobSnapshots";

export function useCloseGroup() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { groupArray, updateGroupArray, jobArray, updateJobArray } =
    useContext(JobArrayContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { updateJobSnapshot } = useJobSnapshotManagement();
  const { uploadGroups, uploadJob } = useFirebase();

  const closeGroup = (groupJobs) => {
    let newGroupArray = [...groupArray];
    let newGroupEntry = { ...activeGroup };
    let newUserJobSnapshot = [...userJobSnapshot];
    let jobsToSave = new Set();

    const {
      outputJobCount,
      materialIDs,
      jobTypeIDs,
      includedJobIDs,
      linkedJobIDs,
      linkedTransIDs,
      linkedOrderIDs,
    } = groupJobs.reduce(
      (prev, job) => {
        if (job.parentJob.length === 0) {
          prev.outputJobCount++;
        }
        prev.materialIDs.add(job.itemID);
        prev.jobTypeIDs.add(job.itemID);
        prev.includedJobIDs.add(job.jobID);
        prev.linkedJobIDs = new Set([...prev.linkedJobIDs, ...job.apiJobs]);
        prev.linkedOrderIDs = new Set([
          ...prev.linkedOrderIDs,
          ...job.apiOrders,
        ]);
        prev.linkedTransIDs = new Set([
          ...prev.linkedTransIDs,
          ...job.apiTransactions,
        ]);

        job.build.materials.forEach((mat) => {
          prev.materialIDs.add(mat.typeID);
        });
        return prev;
      },
      {
        outputJobCount: 0,
        materialIDs: new Set(),
        jobTypeIDs: new Set(),
        includedJobIDs: new Set(),
        linkedJobIDs: new Set(),
        linkedTransIDs: new Set(),
        linkedOrderIDs: new Set(),
      }
    );

    newGroupEntry.includedJobIDs = [...includedJobIDs];
    newGroupEntry.includedTypeIDs = [...jobTypeIDs];
    newGroupEntry.materialIDs = [...materialIDs];
    newGroupEntry.outputJobCount = outputJobCount;
    newGroupEntry.linkedJobIDs = [...linkedJobIDs];
    newGroupEntry.linkedOrderIDs = [...linkedOrderIDs];
    newGroupEntry.linkedTransIDs = [...linkedTransIDs];

    const filteredJobs = jobArray.filter((job) =>
      groupJobs.some((groupJob) => groupJob.jobID === job.jobID)
    );

    const newJobArray = filteredJobs.map((job) => {
      if (includedJobIDs.has(job.jobID)) {
        const newJob = { ...job };
        newJob.parentJob = newJob.parentJob.filter((id) =>
          includedJobIDs.has(id)
        );
        newJob.build.materials.forEach((mat) => {

          newJob.build.childJobs[mat.typeID] = newJob.build.childJobs[mat.typeID].filter((id) => includedJobIDs.has(id));
        });
        if (newJob.isReadyToSell) {
          newUserJobSnapshot = updateJobSnapshot(
            newJob,
            newUserJobSnapshot
          );
        }
        jobsToSave.add(newJob.jobID);
        return newJob;
      } else {
        return job;
      }
    });

    for (const startingJob of newJobArray) {
      if (!includedJobIDs.has(startingJob.jobID)) continue;

      for (const parentID of startingJob.parentJob) {
        let parentMatch = newJobArray.find((i) => i.jobID === parentID);
        if (!parentMatch) continue;
        let materialMatch = parentMatch.build.childJobs[startingJob.itemID]
        if (!materialMatch) continue;
        if (!materialMatch.includes(startingJob.jobID)) {
          materialMatch.push(startingJob.jobID);
          jobsToSave.add(parentMatch.jobID);
        }
      }

      for (const startingMaterial of startingJob.build.materials) {
        for (const childID of startingMaterial.build.childJobs[startingMaterial.typeID]) {
          let childMatch = newJobArray.find((i) => i.jobID === childID);
          if (!childMatch) continue;
          if (!childMatch.parentJob.includes(startingJob.jobID)) {
            childMatch.parentJob.push(startingJob.jobID);
            jobsToSave.add(childMatch);
          }
        }
      }
    }

    let index = newGroupArray.findIndex(
      (i) => i.groupID === activeGroup.groupID
    );

    if (index !== -1) {
      newGroupArray[index] = newGroupEntry;
    } else {
      newGroupArray.push(newGroupEntry);
    }
    updateActiveGroup(null);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateGroupArray(newGroupArray);
    updateMultiSelectJobPlanner([]);
    updateEditGroupTrigger((prev) => !prev);
    if (isLoggedIn) {
      uploadGroups(newGroupArray);
      jobsToSave.forEach((jobID) => {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) return;
        uploadJob(job);
      });
    }
  };

  return { closeGroup };
}
