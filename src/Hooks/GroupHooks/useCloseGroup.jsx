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
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";

function useCloseGroup() {
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
  const { uploadJob } = useFirebase();

  async function closeGroup(groupJobs) {
    let newGroupArray = [...groupArray];
    const groupEntry = newGroupArray.find((i) => i.groupID === activeGroup);
    let newUserJobSnapshot = [...userJobSnapshot];
    let jobsToSave = new Set();
    const includedJobIDs = new Set();

    groupJobs.forEach((job) => includedJobIDs.add(job.jobID));

    groupEntry.updateGroupData(groupJobs);

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
          newJob.build.childJobs[mat.typeID] = newJob.build.childJobs[
            mat.typeID
          ].filter((id) => includedJobIDs.has(id));
        });
        if (newJob.isReadyToSell) {
          const matchedSnapshot = newUserJobSnapshot.find(
            (i) => i.jobID === newJob.jobID
          );
          matchedSnapshot.setSnapshot(newJob);
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
        let materialMatch = parentMatch.build.childJobs[startingJob.itemID];
        if (!materialMatch) continue;
        if (!materialMatch.includes(startingJob.jobID)) {
          materialMatch.push(startingJob.jobID);
          jobsToSave.add(parentMatch.jobID);
        }
      }

      for (const startingMaterial of startingJob.build.materials) {
        for (const childID of startingJob.build.childJobs[
          startingMaterial.typeID
        ]) {
          let childMatch = newJobArray.find((i) => i.jobID === childID);
          if (!childMatch) continue;
          if (!childMatch.parentJob.includes(startingJob.jobID)) {
            childMatch.parentJob.push(startingJob.jobID);
            jobsToSave.add(childMatch);
          }
        }
      }
    }
    updateActiveGroup(null);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateGroupArray(newGroupArray);
    updateMultiSelectJobPlanner([]);
    updateEditGroupTrigger((prev) => !prev);
    if (isLoggedIn) {
      await uploadGroupsToFirebase(newGroupArray);
      for (const jobID of jobsToSave) {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) return;
        await uploadJob(job);
      }
    }
  }

  return { closeGroup };
}

export default useCloseGroup;
