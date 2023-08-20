import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import {
  IsLoggedIn,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { useJobBuild } from "../useJobBuild";
import { useBlueprintCalc } from "../useBlueprintCalc";
import { useFirebase } from "../useFirebase";
import { SnackBarDataContext } from "../../Context/LayoutContext";

export function useBuildChildJobs() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { findJobData } = useFindJobObject();
  const { buildJob, recalculateItemQty } = useJobBuild();
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const { addNewJob, uploadJob } = useFirebase();

  const buildChildJobs = async (inputJobIDs) => {
    const existingGroupData = await calculateExistingTypeIDs();
    const { buildRequests, jobsToBeModified } = await calculateNeededJobs(
      inputJobIDs,
      existingGroupData
    );
    let newJobData = await buildJob(buildRequests);

    const newJobArray = await buildNewJobArray(newJobData, jobsToBeModified);

    const groupJobs = newJobArray.filter(
      (i) => i.groupID === activeGroup.groupID
    );

    const { outputJobCount, materialIDs, jobTypeIDs, includedJobIDs } =
      groupJobs.reduce(
        (prev, job) => {
          if (job.parentJob.length === 0) {
            prev.outputJobCount++;
          }
          prev.materialIDs.add(job.itemID);
          prev.jobTypeIDs.add(job.itemID);
          prev.includedJobIDs.add(job.jobID);

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
        }
      );

    updateActiveGroup((prev) => ({
      ...prev,
      includedTypeIDs: [...jobTypeIDs],
      includedJobIDs: [...includedJobIDs],
      outputJobCount: outputJobCount,
      materialIDs: [...materialIDs],
    }));

    updateJobArray(newJobArray);

    if (jobsToBeModified.length > 0 && buildRequests.length > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${jobsToBeModified.length} Jobs Updated & ${buildRequests.length} Jobs Created`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    }
    if (buildRequests.length > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${buildRequests.length} Jobs Created`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    }
    if (jobsToBeModified.length > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${jobsToBeModified.length} Jobs Updated `,
        severity: "success",
        autoHideDuration: 3000,
      }));
    }
    if (jobsToBeModified.length === 0 && buildRequests.length === 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Job Tree Complete`,
        severity: "success",
        autoHideDuration: 3000,
      }));
    }
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
            childJobIDs: new Set(job.build.childJobs[material.typeID]),
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
        // if (requestedJob.build.childJobs[material.typeID].length > 0) {
        //   return
        // }
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
          jobsToBeModified = updateModifiedEntry(
            material,
            jobsToBeModified,
            inputJobID
          );
        }
      });
    }

    return { buildRequests, jobsToBeModified };
  }

  async function buildNewJobArray(newJobData, jobsToBeModified) {
    let newJobArray = [...jobArray, ...newJobData];
    if (isLoggedIn) {
      for (let job of newJobData) {
        addNewJob(job);
      }
    }

    newJobArray = linkNewJobsToParent(newJobData, newJobArray);

    for (let modifiedData of jobsToBeModified) {
      let job = newJobArray.find((i) => i.jobID === modifiedData.jobID);

      if (!job) {
        continue;
      }
      job.parentJob = [
        ...new Set(job.parentJob, [...modifiedData.parentJobIDs]),
      ];

      recalculateItemQty(job, modifiedData.itemQty);
      job.build.materials = CalculateResources({
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

      job.build.time = CalculateTime({
        jobType: job.jobType,
        CharacterHash: job.build.buildChar,
        structureType: job.structureType,
        rigType: job.rigType,
        runCount: job.runCount,
        bpTE: job.bpTE,
        rawTime: job.rawData.time,
        skills: job.skills,
      });

      if (isLoggedIn) {
        uploadJob(job);
      }
    }

    return newJobArray;
  }

  return {
    buildChildJobs,
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
      let parentMatch = jobArray.find((i) => i.jobID === parentJobID);
      let materialMatch = parentMatch.build.materials.find(
        (i) => i.typeID === newJob.itemID
      );

      materialMatch.childJob = [
        ...new Set([newJob.jobID], materialMatch.childJob),
      ];
    }
  }
  return jobArray;
}
