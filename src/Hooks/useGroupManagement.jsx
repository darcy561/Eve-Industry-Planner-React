import { useContext } from "react";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../Context/AuthContext";
import { jobTypes } from "../Context/defaultValues";
import { ActiveJobContext, JobArrayContext } from "../Context/JobContext";
import { useFindJobObject } from "./GeneralHooks/useFindJobObject";
import { useBlueprintCalc } from "./useBlueprintCalc";
import { useFirebase } from "./useFirebase";
import { useJobBuild } from "./useJobBuild";
import uuid from "react-uuid";
import { useJobSnapshotManagement } from "./JobHooks/useJobSnapshots";
import { useHelperFunction } from "./GeneralHooks/useHelperFunctions";
import createGroupObject from "./GroupHooks/groupsConstructor";

export function useGroupManagement() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { deleteJobSnapshot, newJobSnapshot } = useJobSnapshotManagement();
  const { findJobData } = useFindJobObject();
  const { addNewJob, uploadGroups, uploadUserJobSnapshot, uploadJob } =
    useFirebase();
  const { buildJob, recalculateItemQty } = useJobBuild();
  const { calculateResources, calculateTime } = useBlueprintCalc();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();

  function newJobGroupTemplate(
    assignedGroupID,
    outputJobNames,
    inputIDs,
    includedTypeIDs,
    materialIDs,
    outputJobCount
  ) {
    this.groupName = outputJobNames.join(", ").substring(0, 75);
    this.groupID = assignedGroupID;
    this.includedJobIDs = inputIDs;
    this.includedTypeIDs = [...includedTypeIDs];
    this.materialIDs = [...materialIDs];
    this.outputJobCount = outputJobCount;
    this.areComplete = [];
    this.showComplete = true;
    this.groupStatus = 0;
    this.groupType = 1;
    this.linkedJobIDs = [];
    this.linkedOrderIDs = [];
    this.linkedTransIDs = [];
  }

  const createNewGroupWithJobs = async (inputJobIDs) => {
    let newJobArray = [...jobArray];
    let newUserJobSnapshot = [...userJobSnapshot];
    let newGroupArray = [...groupArray];
    let jobTypeIDs = new Set();
    let outputJobCount = 0;
    let jobsToSave = new Set();
    let materialIDs = new Set();
    let outputJobNames = [];
    let assignedGroupID = `group-${uuid()}`;

    for (let inputID of inputJobIDs) {
      let [inputJob, inputJobSnapshot] = await findJobData(
        inputID,
        newUserJobSnapshot,
        newJobArray,
        undefined,
        "all"
      );
      if (!inputJob) {
        continue;
      }

      inputJob.groupID = assignedGroupID;

      for (let id of inputJob.parentJob) {
        if (inputJobIDs.includes(id)) {
          continue;
        }
        let job = await findJobData(id, newUserJobSnapshot, newJobArray);
        if (!job) {
          continue;
        }
        let material = job.build.childJobs[inputJob.itemID];
        if (!material) {
          continue;
        }
        material = material.filter((i) => i !== inputJob.jobID);
      }

      inputJob.parentJob = inputJob.parentJob.filter((i) =>
        inputJobIDs.includes(i)
      );

      for (let mat of inputJob.build.materials) {
        let childJobArray = inputJob.build.childJobs[mat.typeID];
        for (let id of childJobArray) {
          if (inputJobIDs.includes(id)) {
            continue;
          }
          let job = await findJobData(id, newUserJobSnapshot, newJobArray);
          if (!job) {
            continue;
          }
          job.parentJob = job.parentJob.filter((i) => !inputJob.jobID);
        }
        childJobArray = childJobArray.filter((i) => inputJobIDs.includes(i));
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
    const groupObject = createGroupObject();
    console.log(groupObject);
    let newGroupEntry = {
      ...new newJobGroupTemplate(
        assignedGroupID,
        outputJobNames,
        inputJobIDs,
        jobTypeIDs,
        materialIDs,
        outputJobCount
      ),
    };
    newGroupArray.push(newGroupEntry);
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
      uploadGroups(newGroupArray);

      jobsToSave.forEach((id) => {
        let job = newJobArray.find((i) => i.jobID === id);
        if (!job) {
          return;
        }
        uploadJob(job);
      });
    }

    updateJobArray(newJobArray);
    updateUserJobSnapshot(newUserJobSnapshot);

    return { newGroupEntry, newGroupArray };
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
        undefined,
        "groupJob"
      );
      if (!foundJob) {
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
      const childJobs = outputJob.build.childJobs[material.typeID];
      finalBuildCost += findItemBuildCost(material, childJobs);
    }

    function findItemBuildCost(material, inputChildJobs) {
      if (material.purchaseComplete || inputChildJobs.length === 0) {
        return material.purchasedCost;
      }

      let returnTotal = 0;
      let totalProduced = 0;

      for (let childJobID of inputChildJobs) {
        let childJob = jobArray.find((i) => i.jobID === childJobID);

        if (!childJob) {
          continue;
        }
        returnTotal += childJob.build.costs.installCosts;
        returnTotal += childJob.build.costs.extrasTotal;
        totalProduced += childJob.build.products.totalQuantity;
        for (let cMaterial of childJob.build.materials) {
          const childJobs = childJob.build.childJobs[cMaterial.typeID];
          returnTotal += findItemBuildCost(cMaterial, childJobs);
        }
      }
      return Math.round(returnTotal / totalProduced) * material.quantity;
    }
    return finalBuildCost / outputJob.build.products.totalQuantity;
  };

  const buildNextJobs = async (inputIDs) => {
    let selectedGroupObject = groupArray.find((i) => i.groupID === activeGroup);
    let existingTypeIDData = [];
    let existingIDSet = new Set();
    let modifiedJobData = [];
    let modifiedJobIDSet = new Set();
    let buildRequests = [];
    let buildRequestsIDSet = new Set();
    let newJobIDs = new Set();
    let newJobArray = [...jobArray];
    let newMaterialIDs = new Set(selectedGroupObject.materialIDs);
    let newTypeIDs = new Set(selectedGroupObject.includedTypeIDs);
    let newFinalJobIDs = new Set(selectedGroupObject.includedJobIDs);

    await buildExistingTypes(selectedGroupObject);
    await generateRequestList(selectedGroupObject);

    let newJobData = await buildJob(buildRequests);

    for (let newJob of newJobData) {
      newJobIDs.add(newJob.jobID);
      newTypeIDs.add(newJob.itemID);
      newMaterialIDs.add(newJob.itemID);

      newJob.build.materials.forEach((material) => {
        newMaterialIDs.add(material.typeID);
      });

      for (let parentID of newJob.parentJob) {
        let parentJob = newJobArray.find((i) => i.jobID === parentID);

        parentJob.build.childJobs[newJob.itemID].push(newJob.jobID);
      }

      newJobArray.push(newJob);
      if (isLoggedIn) {
        addNewJob(newJob);
      }
    }
    updateModifiedJobs();

    newFinalJobIDs = new Set([...newFinalJobIDs, ...newJobIDs]);

    const newGroupArray = [...groupArray];
    const objectToUpdate = newGroupArray.find((i) => i.groupID === activeGroup);

    objectToUpdate.includedTypeIDs = [...newTypeIDs];
    objectToUpdate.includedJobIDs = [...newFinalJobIDs];
    objectToUpdate.outputJobCount = objectToUpdate.outputJobCount +=
      newJobData.length;
    objectToUpdate.materialIDs = [...newMaterialIDs];

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);

    if (modifiedJobData.length > 0 && buildRequests.length > 0) {
      sendSnackbarNotificationSuccess(
        `${modifiedJobData.length} Jobs Updated & ${buildRequests.length} Jobs Created`,
        3
      );
    }
    if (buildRequests.length > 0) {
      sendSnackbarNotificationSuccess(
        `${buildRequests.length} Jobs Created`,
        3
      );
    }
    if (modifiedJobData.length > 0) {
      sendSnackbarNotificationSuccess(
        `${modifiedJobData.length} Jobs Updated`,
        3
      );
    }
    if (modifiedJobData.length === 0 && buildRequests.length === 0) {
      sendSnackbarNotificationSuccess(`Job Tree Complete`);
    }

    async function buildExistingTypes(selectedGroupObject) {
      for (let jobID of [...selectedGroupObject.includedJobIDs]) {
        let job = await findJobData(
          jobID,
          userJobSnapshot,
          newJobArray,
          undefined,
          "groupJob"
        );
        if (!job) {
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
            itemID: material.typeID,
            name: material.name,
            childJobs: new Set([job.build.childJobs[material.typeID]]),
          });
        });

        existingTypeIDData.push({
          name: job.name,
          jobID: job.jobID,
          itemID: job.itemID,
          itemQty: job.build.products.totalQuantity,
          parentJobs: new Set([...job.parentJob]),
          childJobs: childJobArray,
        });
      }
    }

    async function generateRequestList(selectedGroupObject) {
      for (let inputJobID of inputIDs) {
        let inputJob = await findJobData(
          inputJobID,
          userJobSnapshot,
          newJobArray
        );
        if (!inputJob) {
          continue;
        }

        inputJob.build.materials.forEach((material) => {
          if (inputJob.build.childJobs[material.typeID].length > 0) {
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
              (i) => i.itemID === material.typeID
            );

            let evenQuantity = Math.floor(
              material.quantity / existingTypeData.length
            );
            let remainingQuantity = material.quantity % existingTypeData.length;

            for (let dataSet of existingTypeData) {
              dataSet.itemQty += evenQuantity;
              dataSet.parentJobs.add(inputJob.jobID);
            }
            existingTypeData[0].itemQty += remainingQuantity;
            modifiedJobData = modifiedJobData.concat(existingTypeData);
            modifiedJobIDSet.add(material.typeID);
            existingTypeData = existingTypeData.filter(
              (i) => i.itemID !== material.typeID
            );
            existingIDSet.delete(material.typeID);
            return;
          }

          if (modifiedJobIDSet.has(material.typeID)) {
            let modifiedTypeData = modifiedJobData.filter(
              (i) => i.itemID === material.typeID
            );
            let evenQuantity = Math.floor(
              material.quantity / modifiedTypeData.length
            );
            let remainingQuantity = material.quantity % modifiedTypeData.length;

            for (let dataSet of modifiedTypeData) {
              dataSet.itemQty += evenQuantity;
              dataSet.parentJobs.add(inputJob.jobID);
            }
            modifiedTypeData[0].itemQty += remainingQuantity;
            modifiedJobData = modifiedJobData.filter(
              (i) => i.itemID !== material.typeID
            );

            modifiedJobData = modifiedJobData.concat(modifiedTypeData);
            return;
          }

          if (buildRequestsIDSet.has(material.typeID)) {
            let buildData = buildRequests.find(
              (i) => i.itemID === material.typeID
            );
            buildData.parentJobs.add(inputJob.jobID);
            buildData.itemQty += material.quantity;
          } else {
            buildRequestsIDSet.add(material.typeID);
            buildRequests.push({
              name: material.name,
              itemID: material.typeID,
              itemQty: material.quantity,
              parentJobs: new Set([inputJob.jobID]),
              childJobs: [],
              groupID: selectedGroupObject.groupID,
            });
          }
        });
      }
    }

    function updateModifiedJobs() {
      for (let modifiedData of modifiedJobData) {
        let job = newJobArray.find((i) => i.jobID === modifiedData.jobID);

        if (!job) {
          continue;
        }

        job.parentJob = [
          ...new Set(job.parentJob, [...modifiedData.parentJobs]),
        ];

        recalculateItemQty(job, modifiedData.itemQty);
        job.build.materials = calculateResources({
          jobType: job.jobType,
          rawMaterials: job.rawData.materials,
          outputMaterials: job.build.materials,
          runCount: job.runCount,
          jobCount: job.jobCount,
          bpME: job.bpME,
          structureType: job.structureType,
          rigType: job.rigType,
          systemType: job.systemType,
        });

        job.build.products.totalQuantity =
          job.rawData.products[0].quantity * job.runCount * job.jobCount;

        job.build.products.quantityPerJob =
          job.rawData.products[0].quantity * job.jobCount;

        job.build.time = calculateTime({
          jobType: job.jobType,
          CharacterHash: job.build.buildChar,
          structureType: job.structureType,
          rigType: job.rigType,
          runCount: job.runCount,
          bpTE: job.bpTE,
          rawTime: job.rawData.time,
          skills: job.skills,
        });

        for (let parentID of modifiedData.parentJobs) {
          let parentJob = newJobArray.find((i) => i.jobID === parentID);
          if (!parentJob) {
            continue;
          }

          let material = parentJob.build.materials.find(
            (i) => i.typeID === modifiedData.itemID
          );
          if (!material) {
            continue;
          }
          material.childJob = [
            ...new Set(
              [modifiedData.jobID],
              parentJob.build.childJobs[modifiedData.itemID]
            ),
          ];
        }

        if (isLoggedIn) {
          uploadJob(job);
        }
      }
    }
  };

  const buildFullJobTree = async (inputIDs) => {
    let selectedGroupObject = groupArray.find((i) => i.groupID === activeGroup);

    let newJobArray = [...jobArray];
    let existingIDSet = new Set();
    let existingTypeIDData = [];
    let modifiedJobIDSet = new Set();
    let modifiedJobData = [];
    let buildRequestsIDSet = new Set();
    let buildRequests = [];
    let newMaterialIDs = new Set(selectedGroupObject.materialIDs);
    let newTypeIDs = new Set(selectedGroupObject.includedTypeIDs);
    let newFinalJobIDs = new Set(selectedGroupObject.includedJobIDs);
    let totalJobsCreated = 0;

    await buildExistingTypes();
    await buildTree(inputIDs, selectedGroupObject);
    if (isLoggedIn) {
      for (let jobID of [...newFinalJobIDs]) {
        let job = await findJobData(
          jobID,
          userJobSnapshot,
          newJobArray,
          undefined,
          "groupJob"
        );
        if (!job) {
          return;
        }
        addNewJob(job);
      }
    }
    const newGroupArray = [groupArray];
    let groupToUpdate = newGroupArray.find((i) => i.groupID === activeGroup);

    (groupToUpdate.includedTypeIDs = [...newTypeIDs])(
      (groupToUpdate.includedJobIDs = [...newFinalJobIDs])
    )(
      (groupToUpdate.outputJobCount = groupToUpdate.outputJobCount +=
        totalJobsCreated)
    )((groupToUpdate.materialIDs = [...newMaterialIDs]));
    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    sendSnackbarNotificationSuccess(`${totalJobsCreated} Jobs Created`, 3);

    async function buildTree(inputs, selectedGroupObject) {
      let newJobIDs = new Set();

      for (let jobID of inputs) {
        let job = await findJobData(
          jobID,
          userJobSnapshot,
          newJobArray,
          undefined,
          "groupJob"
        );
        if (!job) {
          continue;
        }

        await generateRequestList(job, selectedGroupObject);
      }
      if (buildRequests.length === 0) {
        return;
      }
      totalJobsCreated += buildRequests.length;
      let newJobData = await buildJob(buildRequests);

      for (let newJob of newJobData) {
        newJobIDs.add(newJob.jobID);
        newTypeIDs.add(newJob.itemID);
        newMaterialIDs.add(newJob.itemID);
        newFinalJobIDs.add(newJob.jobID);

        newJob.build.materials.forEach((material) => {
          newMaterialIDs.add(material.typeID);
        });

        for (let parentID of newJob.parentJob) {
          let parentJob = newJobArray.find((i) => i.jobID === parentID);

          parentJob.build.childJobs[newJob.itemID].push(newJob.jobID);
        }

        newJobArray.push(newJob);

        let childJobArray = [];
        existingIDSet.add(newJob.itemID);
        newJob.build.materials.forEach((material) => {
          if (
            material.jobType !== jobTypes.manufacturing &&
            material.jobType !== jobTypes.reaction
          ) {
            return;
          }

          childJobArray.push({
            itemID: material.typeID,
            name: material.name,
            childJobs: new Set([...newJob.build.childJobs[material.typeID]]),
          });
        });

        existingTypeIDData.push({
          name: newJob.name,
          jobID: newJob.jobID,
          itemID: newJob.itemID,
          itemQty: newJob.build.products.totalQuantity,
          parentJobs: new Set([...newJob.parentJob]),
          childJobs: childJobArray,
        });
      }
      buildRequestsIDSet = new Set();
      buildRequests = [];
      await buildTree([...newJobIDs]);
    }

    async function buildExistingTypes() {
      for (let jobID of inputIDs) {
        let job = await findJobData(
          jobID,
          userJobSnapshot,
          newJobArray,
          groupArray,
          "groupJob"
        );
        if (!job) {
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
            itemID: material.typeID,
            name: material.name,
            childJobs: new Set([...job.build.childJobs[material.typeID]]),
          });
        });

        existingTypeIDData.push({
          name: job.name,
          jobID: job.jobID,
          itemID: job.itemID,
          itemQty: job.build.products.totalQuantity,
          parentJobs: new Set([...job.parentJob]),
          childJobs: childJobArray,
        });
      }
    }

    async function generateRequestList(inputJob, selectedGroupObject) {
      inputJob.build.materials.forEach((material) => {
        if (inputJob.build.childJobs[material.typeID].length > 0) {
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
            (i) => i.itemID === material.typeID
          );

          let evenQuantity = Math.floor(
            material.quantity / existingTypeData.length
          );
          let remainingQuantity = material.quantity % existingTypeData.length;

          for (let dataSet of existingTypeData) {
            dataSet.itemQty += evenQuantity;
            dataSet.parentJobs.add(inputJob.jobID);
          }
          existingTypeData[0].itemQty += remainingQuantity;
          modifiedJobData = modifiedJobData.concat(existingTypeData);
          modifiedJobIDSet.add(material.typeID);
          existingTypeData = existingTypeData.filter(
            (i) => i.itemID !== material.typeID
          );
          existingIDSet.delete(material.typeID);
          return;
        }

        if (modifiedJobIDSet.has(material.typeID)) {
          let modifiedTypeData = modifiedJobData.filter(
            (i) => i.itemID === material.typeID
          );
          let evenQuantity = Math.floor(
            material.quantity / modifiedTypeData.length
          );
          let remainingQuantity = material.quantity % modifiedTypeData.length;

          for (let dataSet of modifiedTypeData) {
            dataSet.itemQty += evenQuantity;
            dataSet.parentJobs.add(inputJob.jobID);
          }
          modifiedTypeData[0].itemQty += remainingQuantity;
          modifiedJobData = modifiedJobData.filter(
            (i) => i.itemID !== material.typeID
          );

          modifiedJobData = modifiedJobData.concat(modifiedTypeData);
          return;
        }

        if (buildRequestsIDSet.has(material.typeID)) {
          let buildData = buildRequests.find(
            (i) => i.itemID === material.typeID
          );
          buildData.parentJobs.add(inputJob.jobID);
          buildData.itemQty += material.quantity;
        } else {
          buildRequestsIDSet.add(material.typeID);
          buildRequests.push({
            name: material.name,
            itemID: material.typeID,
            itemQty: material.quantity,
            parentJobs: new Set([inputJob.jobID]),
            childJobs: [],
            groupID: selectedGroupObject.groupID,
          });
        }
      });
    }
  };

  return {
    buildFullJobTree,
    buildNextJobs,
    calculateCurrentJobBuildCostFromChildren,
    createNewGroupWithJobs,
    deleteGroupWithoutJobs,
    replaceGroupData,
  };
}
