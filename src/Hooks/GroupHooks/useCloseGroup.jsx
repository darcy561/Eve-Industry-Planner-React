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
import { useJobManagement } from "../useJobManagement";

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
  const { updateJobSnapshotFromFullJob } = useJobManagement();
  const { uploadGroups } = useFirebase();

  const closeGroup = (groupJobs) => {
    let newGroupArray = [...groupArray];
    let newGroupEntry = { ...activeGroup };
    let newUserJobSnapshot = [...userJobSnapshot];

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
        prev.linkedOrderIDs = new Set(
          [...prev.linkedOrderIDs,
          ...job.apiOrders]
        );
        prev.linkedTransIDs = new Set(
          [...prev.linkedTransIDs,
          ...job.apiTransactions]
        );

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
    console.log(newGroupEntry)

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
          mat.childJo = mat.childJob.filter((id) => includedJobIDs.has(id));
        });
        if (newJob.isReadyToSell) {
          newUserJobSnapshot = updateJobSnapshotFromFullJob(
            newJob,
            newUserJobSnapshot
          );
        }
        return newJob;
      } else {
        return job;
      }
    });

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
    }
  };

  return { closeGroup };
}
