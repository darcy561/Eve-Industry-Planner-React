import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { ActiveJobContext, JobArrayContext } from "../Context/JobContext";
import { JobPlannerPageTriggerContext } from "../Context/LayoutContext";
import { useFirebase } from "./useFirebase";
import { useJobManagement } from "./useJobManagement";

export function useGroupManagement() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { findJobData, updateJobSnapshotFromFullJob } = useJobManagement();
  const { uploadGroups, uploadUserJobSnapshot, uploadJob } = useFirebase();

  class JobGroupTemplate {
    constructor(groupID, inputIDs, includedTypeIDs, outputJobCount) {
      this.groupName = "Untitled Group";
      this.groupID = groupID;
      this.includedJobIDs = inputIDs;
      this.includedTypeIDs = [...includedTypeIDs];
      this.outputJobCount = outputJobCount;
      this.groupStatus = 0;
      this.groupType = 1;
    }
  }

  const createNewGroupWithJobs = async (inputJobIDs) => {
    const newGroupID = `group-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let jobTypeIDs = new Set();
    let outputJobCount = 0;
    let jobsToSave = new Set();

    for (let inputID of inputJobIDs) {
      let [inputJob] = await findJobData(
        inputID,
        newUserJobSnapshot,
        newJobArray
      );
      if (inputJob === undefined) {
        continue;
      }

      inputJob.groupID = newGroupID;

      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        inputJob,
        newUserJobSnapshot
      );

      jobTypeIDs.add(inputJob.itemID);
      jobsToSave.add(inputJob.jobID);
      outputJobCount++;
    }
    let newGroupEntry = Object.assign(
      {},
      new JobGroupTemplate(newGroupID, inputJobIDs, jobTypeIDs, outputJobCount)
    );

    newGroupArray.push(newGroupEntry);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
    updateGroupArray(newGroupArray);

    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
      uploadGroups(newGroupArray);

      jobsToSave.forEach((id) => {
        let job = newJobArray.find((i) => i.jobID === id);
        if (job === undefined) {
          return;
        }
        uploadJob(job);
      });
    }

    return newGroupEntry;
  };

  const openGroup = async (inputGroupID) => {
    let newJobArray = [...jobArray];
    let requestedGroup = groupArray.find((i) => i.groupID === inputGroupID);
    if (requestedGroup === undefined) {
      return;
    }
    updateActiveGroup(requestedGroup);
    for (let jobID of requestedGroup.includedJobIDs) {
      let [inputJob] = await findJobData(jobID, userJobSnapshot, newJobArray);
      if (inputJob === undefined) {
        continue;
      }
    }

    updateJobArray(newJobArray);

  };

  const closeGroup = async (activeGroup) => {
    updateEditGroupTrigger((prev) => !prev);
  };

  const deleteGroup = async (activeGroupID) => {
    console.log("D")
  }

  const calculateCurrentJobBuildCostFromChildren = (outputJob) => {
    let finalBuildCost = 0;

    const findItemBuildCost = (material) => {
      if (material.purchaseComplete || material.childJob.length === 0) {
        return material.purchasedCost;
      }

      let returnTotal = 0;
      let totalProduced = 0;

      for (let childJobID of material.childJob) {
        let childJob = jobArray.find((i) => i.jobID === childJobID);

        if (childJob === undefined) {
          continue;
        }
        returnTotal += childJob.build.costs.installCosts;
        returnTotal += childJob.build.costs.extrasTotal;
        totalProduced += childJob.build.products.totalQuantity;
        for (let cMaterial of childJob.build.materials) {
          returnTotal += findItemBuildCost(cMaterial);
        }
      }
      return Math.round(returnTotal / totalProduced) * material.quantity;
    };

    finalBuildCost += outputJob.build.costs.installCosts;
    finalBuildCost += outputJob.build.costs.extrasTotal;
    for (let material of outputJob.build.materials) {
      finalBuildCost += findItemBuildCost(material);
    }
    return finalBuildCost / outputJob.build.products.totalQuantity;
  };

  return {
    calculateCurrentJobBuildCostFromChildren,
    closeGroup,
    createNewGroupWithJobs,
    deleteGroup,
    openGroup,
  };
}
