import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { jobTypes } from "../../Context/defaultValues";
import { useJobBuild } from "../useJobBuild";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { useFirebase } from "../useFirebase";
import { useManageGroupJobs } from "./useManageGroupJobs";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";

export function useBuildFullJobTree() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { buildJob } = useJobBuild();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { addNewJob } = useFirebase();
  const { addMultipleJobsToGroup } = useManageGroupJobs();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();

  async function buildFullJobTree(inputJobIDs) {
    let newGroupArray = [...groupArray];
    let newJobArray = [...jobArray];
    let jobHolding = jobArray.filter((i) => inputJobIDs.includes(i.jobID));
    const newJobs = [];
    const existingTypeIDs = new Map();
    const modifiedTypeIDs = new Map();
    const newTypeIDs = new Map();

    await buildJobProcess(
      jobHolding,
      newJobs,
      existingTypeIDs,
      modifiedTypeIDs,
      newTypeIDs
    );
    if (isLoggedIn) {
      for (const job of newJobs) {
        addNewJob(job);
      }
    }
    newGroupArray = addMultipleJobsToGroup(newJobs, newGroupArray, newJobArray);
    newJobArray = [...newJobArray, ...newJobs];

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);
    sendSnackbarNotificationSuccess(`${newJobs.length} Jobs Created`, 3);

    async function buildJobProcess(
      jobHolding,
      newJobs,
      existingTypeIDs,
      modifiedTypeIDs,
      newTypeIDs
    ) {
      buildExistingTypeIDs(jobHolding, existingTypeIDs);
      calculateNeededJobs(
        jobHolding,
        existingTypeIDs,
        modifiedTypeIDs,
        newTypeIDs
      );
      const newJobData = await buildJob(Array.from(newTypeIDs.values()));
      linkNewJobsToParent(newJobData, jobHolding);
      Array.prototype.push.apply(jobHolding, newJobData);
      Array.prototype.push.apply(newJobs, newJobData);
      updateModifiedJobs(newJobData, jobHolding, modifiedTypeIDs);
      cleanupMapObjects(existingTypeIDs, modifiedTypeIDs, newTypeIDs);
      if (newJobData.length === 0) return;
      await buildJobProcess(
        newJobData,
        newJobs,
        existingTypeIDs,
        modifiedTypeIDs,
        newTypeIDs
      );
    }
  }

  function buildExistingTypeIDs(inputJobs, resultsMap) {
    for (const job of inputJobs) {
      if (!job) continue;

      const childJobData = job.build.materials.reduce((output, material) => {
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          output.push({
            itemID: material.typeID,
            name: material.name,
            childJobIDs: new Set(job.build.childJobs[material.typeID]),
          });
        }

        return output;
      }, []);

      resultsMap.set(job.itemID, {
        name: job.name,
        jobID: job.jobID,
        itemID: job.itemID,
        itemQty: job.build.products.totalQuantity,
        parentJobs: new Set(job.parentJob),
        childJobs: childJobData,
      });
    }
  }

  function calculateNeededJobs(
    jobHolding,
    existingTypeIDsMap,
    jobsToBeModified,
    buildRequests
  ) {
    for (const requestedJob of jobHolding) {
      requestedJob.build.materials.forEach((material) => {
        if (
          material.jobType !== jobTypes.manufacturing &&
          material.jobType !== jobTypes.reaction
        ) {
          return;
        }

        const isOriginal = existingTypeIDsMap.has(material.typeID);
        const isModified = jobsToBeModified.has(material.typeID);
        const isBuild = buildRequests.has(material.typeID);

        if (!isOriginal && !isModified && !isBuild) {
          //Add New Build
          buildRequests.set(
            material.typeID,
            addMaterialToBuild(material, activeGroup, requestedJob.jobID)
          );
        }

        if (!isOriginal && !isModified && isBuild) {
          //Update Existing Build
          buildRequests.set(
            material.typeID,
            updateMaterialToBuild(
              material,
              buildRequests.get(material.typeID),
              requestedJob.jobID
            )
          );
        }

        if (isOriginal && !isModified) {
          //Add To Modified & remove from existing
          jobsToBeModified.set(
            material.typeID,
            updateMaterialToBuild(
              material,
              existingTypeIDsMap.get(material.typeID),
              requestedJob.jobID
            )
          );
          existingTypeIDsMap.delete(material.typeID);
        }

        if (!isOriginal && isModified) {
          //update Modified
          jobsToBeModified.set(
            material.typeID,
            updateMaterialToBuild(
              material,
              jobsToBeModified.get(material.typeID),
              requestedJob.jobID
            )
          );
        }
      });
    }
  }

  function addMaterialToBuild(material, activeGroupID, parentJobID) {
    const newObject = {
      name: material.name,
      itemID: material.typeID,
      itemQty: material.quantity,
      parentJobs: new Set([parentJobID]),
      childJobs: [],
      groupID: activeGroupID,
    };

    return newObject;
  }
  function updateMaterialToBuild(material, existingBuildObject, parentJobID) {
    existingBuildObject.parentJobs.add(parentJobID);
    existingBuildObject.itemQty += material.quantity;

    return existingBuildObject;
  }

  function linkNewJobsToParent(newJobs, jobHolding) {
    for (let { parentJob, jobID, itemID } of newJobs) {
      for (let parentJobID of parentJob) {
        let parentMatch = jobHolding.find((i) => i.jobID === parentJobID);
        if (!parentMatch) continue;

        parentMatch.build.childJobs[itemID] = [
          ...new Set([...parentMatch.build.childJobs[itemID], jobID]),
        ];
      }
    }
  }
  async function updateModifiedJobs(newJobData, holdingArray, modifiedMap) {
    const modfiedJobsArray = Array.from(modifiedMap.values());
    const mergedArray = [...newJobData, ...holdingArray];

    for (const modifiedData of modfiedJobsArray) {
      let matchedJob = mergedArray.find((i) => i.jobID === modifiedData.jobID);
      if (!matchedJob) continue;
      matchedJob.parentJob = [
        ...new Set(matchedJob.parentJob, [...modifiedData.parentJobs]),
      ];

      await recalculateJobForNewTotal(matchedJob, modifiedData.itemQty);
    }
  }

  function cleanupMapObjects(
    existingDataMap,
    modifiedDataMap,
    buildingItemsMap
  ) {
    existingDataMap.clear();
    modifiedDataMap.clear();
    buildingItemsMap.clear();
  }

  return { buildFullJobTree };
}
