import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { jobTypes } from "../Context/defaultValues";
import { ActiveJobContext, JobArrayContext } from "../Context/JobContext";
import {
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
} from "../Context/LayoutContext";
import { useFirebase } from "./useFirebase";
import { useJobBuild } from "./useJobBuild";
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
  const { updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { findJobData, deleteJobSnapshot, newJobSnapshot } = useJobManagement();
  const {
    downloadCharacterJobs,
    uploadGroups,
    uploadUserJobSnapshot,
    uploadJob,
  } = useFirebase();
  const {buildJob} = useJobBuild()

  class newJobGroupTemplate {
    constructor(
      groupID,
      outputJobNames,
      inputIDs,
      includedTypeIDs,
      materialIDs,
      outputJobCount
    ) {
      this.groupName = outputJobNames.join(", ");
      this.groupID = groupID;
      this.includedJobIDs = inputIDs;
      this.includedTypeIDs = [...includedTypeIDs];
      this.materialIDs = [...materialIDs];
      this.outputJobCount = outputJobCount;
      this.groupStatus = 0;
      this.groupType = 1;
    }
  }
  class updateJobGroupTemplate {
    constructor(
      inputGroup,
      inputIDs,
      includedTypeIDs,
      materialIDs,
      outputJobCount
    ) {
      this.groupName = inputGroup.groupName;
      this.groupID = inputGroup.groupID;
      this.includedJobIDs = inputIDs;
      this.includedTypeIDs = [...includedTypeIDs];
      this.materialIDs = [...materialIDs];
      this.outputJobCount = outputJobCount;
      this.groupStatus = inputGroup.groupStatus;
      this.groupType = inputGroup.groupType;
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
    let materialIDs = new Set();
    let outputJobNames = [];

    for (let inputID of inputJobIDs) {
      let [inputJob, inputJobSnapshot] = await findJobData(
        inputID,
        newUserJobSnapshot,
        newJobArray,
        "all"
      );
      if (inputJob === undefined) {
        continue;
      }

      inputJob.groupID = newGroupID;

      for (let id of inputJob.parentJob) {
        if (inputJobIDs.includes(id)) {
          continue;
        }
        let job = await findJobData(id, newUserJobSnapshot, newJobArray);
        if (job === undefined) {
          continue;
        }
        let material = job.build.materials.find(
          (i) => i.typeID === inputJob.itemID
        );
        if (material === undefined) {
          continue;
        }
        material.childJob = material.childJob.filter(
          (i) => i !== inputJob.jobID
        );
      }
      inputJob.parentJob = inputJob.parentJob.filter((i) =>
        inputJobIDs.includes(i)
      );

      for (let mat of inputJob.build.materials) {
        for (let id of mat.childJob) {
          if (inputJobIDs.includes(id)) {
            continue;
          }
          let job = await findJobData(id, newUserJobSnapshot, newJobArray);
          if (job === undefined) {
            continue;
          }
          console.log(job);
          job.parentJob = job.parentJob.filter((i) => !inputJob.jobID);
        }
        mat.childJob = mat.childJob.filter((i) => inputJobIDs.includes(i));
      }

      materialIDs = new Set([...materialIDs, ...inputJobSnapshot.materialIDs]);
      newUserJobSnapshot = deleteJobSnapshot(inputJob, newUserJobSnapshot);

      if (inputJob.parentJob.length === 0) {
        outputJobNames.push(inputJob.name);
      }
      jobTypeIDs.add(inputJob.itemID);
      jobsToSave.add(inputJob.jobID);
      outputJobCount++;
    }
    if (outputJobNames.length === 0) {
      outputJobNames.push("Untitled Group");
    }
    let newGroupEntry = Object.assign(
      {},
      new newJobGroupTemplate(
        newGroupID,
        outputJobNames,
        inputJobIDs,
        jobTypeIDs,
        materialIDs,
        outputJobCount
      )
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
      let inputJob = await findJobData(
        jobID,
        userJobSnapshot,
        newJobArray,
        "groupJob"
      );
      if (inputJob === undefined) {
        continue;
      }
    }

    updateJobArray(newJobArray);
  };

  const closeGroup = async (groupJobs) => {
    let newGroupArray = [...groupArray];
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

    let newGroupEntry = Object.assign(
      {},
      new updateJobGroupTemplate(
        activeGroup,
        includedJobIDs,
        jobTypeIDs,
        materialIDs,
        outputJobCount
      )
    );

    newGroupArray = newGroupArray.filter(
      (i) => i.groupID !== activeGroup.groupID
    );
    newGroupArray.push(newGroupEntry);
    updateActiveGroup(null);
    updateGroupArray(newGroupArray);
    updateMultiSelectJobPlanner([]);
    updateEditGroupTrigger((prev) => !prev);
  };

  const replaceGroupData = (inputGroup, chosenGroupArray) => {
    chosenGroupArray = chosenGroupArray.filter(
      (i) => i.groupID !== group.groupID
    );
    chosenGroupArray.push(inputGroup);
    return chosenGroupArray;
  };

  const deleteGroupWithoutJobs = async (inputGroupID) => {
    let newJobArray = [...jobArray];
    let newGroupArray = [...groupArray];
    let newUserJobSnapshot = [...userJobSnapshot];

    let chosenGroup = newGroupArray.find((i) => i.groupID === inputGroupID);

    for (let jobID of chosenGroup.includedJobIDs) {
      let foundJob = await findJobData(
        jobID,
        userJobSnapshot,
        newJobArray,
        "groupJob"
      );
      if (foundJob === undefined) {
        continue;
      }
      foundJob.groupID = null;
      newUserJobSnapshot = newJobSnapshot(foundJob, newUserJobSnapshot);
      if (isLoggedIn) {
        uploadJob(foundJob);
      }
    }
    newGroupArray = newGroupArray.filter((i) => i.groupID !== inputGroupID);

    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
      uploadGroups(newGroupArray);
    }
    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);
  };

  const calculateCurrentJobBuildCostFromChildren = (outputJob) => {
    let finalBuildCost = 0;

    finalBuildCost += outputJob.build.costs.installCosts;
    finalBuildCost += outputJob.build.costs.extrasTotal;
    for (let material of outputJob.build.materials) {
      finalBuildCost += findItemBuildCost(material);
    }

    function findItemBuildCost(material) {
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
    }
    return finalBuildCost / outputJob.build.products.totalQuantity;
  };

  const findGroupData = (inputGroupID, chosenGroupArray) => {
    let foundGroup = chosenGroupArray.find((i) => i.groupID === inputGroupID);

    if (activeGroup.groupID === inputGroupID) {
      foundGroup === activeGroup;
    }
    return foundGroup;
  };

  const buildNextJobs = async (inputIDs) => {
    let existingTypeIDData = [];
    let existingIDSet = new Set();
    let modifiedJobData = [];
    let modifiedJobIDSet = new Set();
    let buildRequests = [];
    let buildRequestsIDSet = new Set();
    let newJobArray = [...jobArray];
    let newGroupArray = [...groupArray];

    await buildExistingTypes();
    await generateRequestList();
    await buildJob(buildRequests)
    async function buildExistingTypes() {
      for (let jobID of [...activeGroup.includedJobIDs]) {
        let job = await findJobData(
          jobID,
          userJobSnapshot,
          newJobArray,
          "groupJob"
        );
        if (job === undefined) {
          continue;
        }
        let childJobArray = [];
        existingIDSet.add(job.itemID);
        job.build.materials.forEach((material) => {
          if (
            material.jobType !== jobTypes.manufacturing &&
            material.jobType !== jobTypes.reaction
          ) {
            return;
          }
          childJobArray.push({
            typeID: material.typeID,
            name: material.name,
            childJobs: new Set([...material.childJob]),
          });
        });

        existingTypeIDData.push({
          name: job.name,
          jobID: job.jobID,
          typeID: job.itemID,
          quantity: job.build.products.totalQuantity,
          parentJobs: new Set([...job.parentJob]),
          childJobs: childJobArray,
        });
      }
    }
    async function generateRequestList() {
      for (let inputJobID of inputIDs) {
        let inputJob = await findJobData(
          inputJobID,
          userJobSnapshot,
          newJobArray
        );
        if (inputJob === undefined) {
          continue;
        }

        inputJob.build.materials.forEach((material) => {
          if (material.childJob.length > 0) {
            return;
          }
          if (
            material.jobType !== jobTypes.manufacturing &&
            material.jobType !== jobTypes.reaction
          ) {
            return;
          }

          if (existingIDSet.has(material.typeID)) {
            let existingTypeData = existingTypeIDData.filter(
              (i) => i.typeID === material.typeID
            );
            let evenQuantity = Math.floor(
              material.quantity / existingTypeData.length
            );
            let remainingQuantity = material.quantity % existingTypeData.length;

            console.log(material);
            for (let dataSet of existingTypeData) {
              console.log(dataSet);
              dataSet.quantity += evenQuantity;
              dataSet.parentJobs = new Set([
                ...inputJob.parentJob,
                ...dataSet.parentJobs,
              ]);
            }
            existingTypeData[0].quantity += remainingQuantity;
            modifiedJobData = modifiedJobData.concat(existingTypeData);
            modifiedJobIDSet.add(material.typeID);
            existingTypeData = existingTypeData.filter(
              (i) => i.typeID !== material.typeID
            );
            existingIDSet.delete(material.typeID);
            return;
          }
          if (modifiedJobIDSet.has(material.typeID)) {
            let modifiedTypeData = modifiedJobData.filter(
              (i) => i.typeID === material.typeID
            );
            let evenQuantity = Math.floor(
              material.quantity / modifiedTypeData.length
            );
            let remainingQuantity = material.quantity % modifiedTypeData.length;

            for (let dataSet of modifiedTypeData) {
              dataSet.quantity += evenQuantity;
              dataSet.parentJobs = new Set([
                ...inputJob.parentJob,
                ...dataSet.parentJobs,
              ]);
            }
            modifiedTypeData[0].quantity += remainingQuantity;
            modifiedJobData = modifiedJobData.filter(
              (i) => i.typeID !== material.typeID
            );

            modifiedJobData = modifiedJobData.concat(modifiedTypeData);
            return;
          }
          if (buildRequestsIDSet.has(material.typeID)) {
            let buildData = buildRequests.find(
              (i) => i.typeID === material.typeID
            );
            buildData.parentJobs.add(inputJob.jobID);
            buildData.quantity += material.quantity;
          } else {
            buildRequestsIDSet.add(material.typeID);
            buildRequests.push({
              name: material.name,
              typeID: material.typeID,
              quantity: material.quantity,
              parentJobs: new Set([inputJob.jobID]),
              childJobs: [],
            });
          }
        });
      }
    }

    console.log(existingTypeIDData);
    console.log(modifiedJobData);
    console.log(buildRequests);
  };

  return {
    buildNextJobs,
    calculateCurrentJobBuildCostFromChildren,
    closeGroup,
    createNewGroupWithJobs,
    deleteGroupWithoutJobs,
    findGroupData,
    openGroup,
    replaceGroupData,
  };
}
