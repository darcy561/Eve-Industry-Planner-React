import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { MultiSelectJobPlannerContext } from "../../Context/LayoutContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import uploadGroupsToFirebase from "../../Functions/Firebase/uploadGroupData";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import Job from "../../Classes/jobConstructor";

function useCloseGroup() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { groupArray, updateGroupArray, jobArray, updateJobArray } =
    useContext(JobArrayContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );

  async function closeGroup(groupJobs) {
    const groupEntry = groupArray.find((i) => i.groupID === activeGroup);
    const jobsToSave = new Set();

    groupEntry.updateGroupData(groupJobs);

    const filteredJobs = jobArray.filter((job) =>
      groupJobs.some((groupJob) => groupJob.jobID === job.jobID)
    );

    const newJobArray = filteredJobs.map((job) => {
      if (!groupEntry.includedJobIDs.has(job.jobID)) return job;

      const newJob = new Job(job);
      newJob.parentJob = newJob.parentJob.filter((id) =>
        groupEntry.includedJobIDs.has(id)
      );
      newJob.build.materials.forEach((mat) => {
        newJob.build.childJobs[mat.typeID] = newJob.build.childJobs[
          mat.typeID
        ].filter((id) => groupEntry.includedJobIDs.has(id));
      });
      if (newJob.isReadyToSell) {
        const matchedSnapshot = userJobSnapshot.find(
          (i) => i.jobID === newJob.jobID
        );
        matchedSnapshot.setSnapshot(newJob);
      }
      jobsToSave.add(newJob.jobID);
      return newJob;
    });

    for (const startingJob of newJobArray) {
      if (!groupEntry.includedJobIDs.has(startingJob.jobID)) continue;
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
    updateUserJobSnapshot([...userJobSnapshot]);
    updateGroupArray([...groupArray]);
    updateMultiSelectJobPlanner([]);
    if (isLoggedIn) {
      await uploadGroupsToFirebase(groupArray);
      for (const jobID of jobsToSave) {
        let job = newJobArray.find((i) => i.jobID === jobID);
        if (!job) return;
        await updateJobInFirebase(job);
      }
    }
  }

  return { closeGroup };
}

export default useCloseGroup;
