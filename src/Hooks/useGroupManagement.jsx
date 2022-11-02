import { useContext } from "react";
import { UserJobSnapshotContext } from "../Context/AuthContext";
import { JobArrayContext } from "../Context/JobContext";
import { useJobManagement } from "./useJobManagement";

export function useGroupManagement() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { findJobData } = useJobManagement();
  class JobGroupTemplate {
    constructor(groupID, inputIDs, includedTypeIDs) {
      this.groupName = "Unitled Group";
      this.groupID = groupID;
      this.includedJobIDs = new Set(inputIDs);
      this.includedTypeIDs = includedTypeIDs;
    }
  }

  const createNewGroupWithJobs = async (inputJobIDs) => {
    const newGroupID = `group-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let jobTypeIDs = new Set();

    for (let inputID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputID,
        newUserJobSnapshot,
        newJobArray
      );
      if (inputJob === undefined) {
        continue;
      }
      jobTypeIDs.add(inputJob.itemID);
    }

    return new JobGroupTemplate(newGroupID, inputJobIDs, jobTypeIDs);
  };

  return {
    createNewGroupWithJobs,
  };
}
