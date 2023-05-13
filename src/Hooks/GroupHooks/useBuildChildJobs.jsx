import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { useJobBuild } from "../useJobBuild";

export function useBuildChildJobs() {
  const { jobArray, groupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { findJobData } = useFindJobObject();
  const {buildJob} = useJobBuild()

  const buildChildJobsNew = async (inputJobIDs) => {
    const currentTypeIDData = await calculateExistingTypeIDs();
    console.log(currentTypeIDData);
    const { buildRequests, jobsToBeModified } = await calculateNeededJobs(
      inputJobIDs,
      currentTypeIDData
    );
    let newJobData = await buildJob(buildRequests)

    const newJobArray = buildNewJobArray(newJobData)

    console.log(newJobData);
    console.log(jobsToBeModified);
  };

  async function calculateExistingTypeIDs() {
    const result = [];

    for (const jobID of activeGroup.includedJobIDs) {
      const job = await findJobData(
        jobID,
        userJobSnapshot,
        jobArray,
        groupArray,
        "groupJob"
      );

      if (!job) {
        continue;
      }

      const childJobData = job.build.materials.reduce((output, material) => {
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          output.push({
            itemID: material.typeID,
            name: material.name,
            childJobIDs: new Set(material.childJob),
          });
        }

        return output;
      }, []);

      result.push({
        name: job.name,
        jobID: job.jobID,
        itemID: job.itemID,
        itemQty: job.build.products.totalQuantity,
        parentJobIDs: new Set(job.parentJob),
        childJobs: childJobData,
      });
    }
    return result;
  }

  async function calculateNeededJobs(requestedJobIDs, existingTypeIDData) {
    let existingTypeIDs = [...existingTypeIDData];
    let buildRequests = [];
    let jobsToBeModified = [];

    for (const inputJobID of requestedJobIDs) {
      const requestedJob = await findJobData(
        inputJobID,
        userJobSnapshot,
        jobArray,
        groupArray,
        "groupJob"
      );
      if (!requestedJob) {
        continue;
      }

      requestedJob.build.materials.forEach((material) => {
        if (
          material.jobType !== jobTypes.manufacturing &&
          material.jobType !== jobTypes.reaction
        ) {
          return;
        }

        const isOriginal = existingTypeIDs.some(
          (i) => i.itemID === material.typeID
        );
        const isModified = jobsToBeModified.some(
          (i) => i.itemID === material.typeID
        );
        const isBuild = buildRequests.some((i) => i.itemID === material.typeID);

        if (!isOriginal && !isModified && !isBuild) {
          //Add New Build
          buildRequests = addMaterialToBuild(
            material,
            buildRequests,
            activeGroup.groupID,
            inputJobID
          );
        }

        if (!isOriginal && !isModified && isBuild) {
          //Update Existing Build
          buildRequests = updateMaterialToBuild(
            material,
            buildRequests,
            inputJobID
          );
        }

        if (isOriginal && !isModified) {
          //Add To Modified & remove from existing
          jobsToBeModified = addNewModifiedEntry(
            material,
            jobsToBeModified,
            existingTypeIDs,
            inputJobID
          );
          existingTypeIDs = removeExistingEntry(material, existingTypeIDs);
        }

        if (!isOriginal && isModified) {
          //update Modified
          jobsToBeModified = updateModifiedEntry(material, jobsToBeModified);
        }
      });
    }

    return { buildRequests, jobsToBeModified };
  }

  async function buildNewJobArray(newJobData) {
    let newJobArray = [...jobArray, ...newJobData]
    
    newJobArray = linkNewJobsToParent(newJobData, newJobArray)
    

    return newJobArray
  }



  return {
    buildChildJobsNew,
  };
}

function calculateQuantities(materialQuantity, dataSetLength) {
  const evenQuantity = Math.floor(materialQuantity / dataSetLength);
  const remainingQuantity = materialQuantity % dataSetLength;
  return { evenQuantity, remainingQuantity };
}

function addMaterialToBuild(
  material,
  existingBuildRequests,
  activeGroupID,
  parentJobID
) {
  const newObject = {
    name: material.name,
    itemID: material.typeID,
    itemQty: material.quantity,
    parentJobs: new Set([parentJobID]),
    childJobs: [],
    groupID: activeGroupID,
  };
  const newBuildRequests = [...existingBuildRequests, newObject];

  return newBuildRequests;
}

function updateMaterialToBuild(material, existingBuildRequests, parentJobID) {
  const newBuildRequests = [...existingBuildRequests];

  const entry = newBuildRequests.find((i) => i.itemID === material.typeID);

  entry.parentJobs.add(parentJobID);
  entry.itemQty += material.quantity;

  return newBuildRequests;
}

function addNewModifiedEntry(
  material,
  existingModifiedEntries,
  originalEntries,
  parentJobID
) {
  const entriesToMove = originalEntries.filter(
    (i) => i.itemID === material.typeID
  );

  const { evenQuantity, remainingQuantity } = calculateQuantities(
    material.quantity,
    entriesToMove.length
  );

  entriesToMove.forEach((entry) => {
    entry.itemQty += evenQuantity;
    entry.parentJobIDs.add(parentJobID);
  });

  entriesToMove[0].itemQty += remainingQuantity;

  return [...existingModifiedEntries, ...entriesToMove];
}

function updateModifiedEntry(material, existingModified, parentJobID) {
  const entriesToUpdate = existingModified.filter(
    (i) => i.itemID === material.typeID
  );

  const { evenQuantity, remainingQuantity } = calculateQuantities(
    material.quantity,
    entriesToUpdate.length
  );

  entriesToUpdate.forEach((entry) => {
    entry.itemQty += evenQuantity;
    entry.parentJobIDs.add(parentJobID);
  });

  entriesToUpdate[0].itemQty += remainingQuantity;

  const newExistingModified = existingModified.filter(
    (i) => i.itemID !== material.typeID
  );

  return [...newExistingModified, ...entriesToUpdate];
}

function removeExistingEntry(material, existingData) {
  return existingData.filter((i) => i.itemID !== material.typeID);
}
function linkNewJobsToParent(newJobs, jobArray) {
  for (let newJob of newJobs) {
    for (let parentJobID of newJob.parentJob) {
      let parentMatch = jobArray.find((i) => i.jobID === parentJobID)
      let materialMatch = parentMatch.build.materials.find(i => i.typeID === newJob.itemID)

      materialMatch.childJob.push(newJob.jobID)
    }
  }
  return jobArray
}
