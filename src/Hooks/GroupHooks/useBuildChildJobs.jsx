import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { useJobBuild } from "../useJobBuild";
import { useFirebase } from "../useFirebase";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";

export function useBuildChildJobs() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { findJobData } = useFindJobObject();
  const { buildJob } = useJobBuild();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { addNewJob, uploadJob } = useFirebase();

  const buildChildJobs = async (inputJobIDs) => {
    const existingGroupData = await calculateExistingTypeIDs();
    const { buildRequests, jobsToBeModified } = await calculateNeededJobs(
      inputJobIDs,
      existingGroupData
    );
    let newJobData = await buildJob(buildRequests);

    const newJobArray = await buildNewJobArray(newJobData, jobsToBeModified);

    const groupJobs = newJobArray.filter((i) => i.groupID === activeGroup);

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
    const newGroupArray = [...groupArray];
    let groupToUpdate = newGroupArray.find((i) => i.groupID === activeGroup);

    groupToUpdate.includedTypeIDs = [...jobTypeIDs];
    groupToUpdate.includedJobIDs = [...includedJobIDs];
    groupToUpdate.outputJobCount = outputJobCount;
    groupToUpdate.materialIDs = [...materialIDs];

    updateGroupArray(newGroupArray);
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
    const resultMap = new Map();

    const selectedGroupObject = groupArray.find(
      (i) => i.groupID === activeGroup
    );

    for (const jobID of selectedGroupObject.includedJobIDs) {
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

      resultMap.set(job.itemID, {
        name: job.name,
        jobID: job.jobID,
        itemID: job.itemID,
        itemQty: job.build.products.totalQuantity,
        parentJobs: new Set(job.parentJob),
        childJobs: childJobData,
      });
    }
    return resultMap;
  }

  async function calculateNeededJobs(requestedJobIDs, existingTypeIDsMap) {
    let buildRequests = new Map();
    let jobsToBeModified = new Map();

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

        const isOriginal = existingTypeIDsMap.has(material.typeID);
        const isModified = jobsToBeModified.has(material.typeID);
        const isBuild = buildRequests.has(material.typeID);

        if (!isOriginal && !isModified && !isBuild) {
          //Add New Build
          buildRequests.set(
            material.typeID,
            addMaterialToBuild(material, activeGroup, inputJobID)
          );
        }

        if (!isOriginal && !isModified && isBuild) {
          //Update Existing Build
          buildRequests.set(
            material.typeID,
            updateMaterialToBuild(
              material,
              buildRequests.get(material.typeID),
              inputJobID
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
              inputJobID
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
              inputJobID
            )
          );
        }
      });
    }

    buildRequests = Array.from(buildRequests.values());
    jobsToBeModified = Array.from(jobsToBeModified.values());

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
      job.parentJob = [...new Set(job.parentJob, [...modifiedData.parentJobs])];

      await recalculateJobForNewTotal(job, modifiedData.itemQty);

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

function linkNewJobsToParent(newJobs, jobArray) {
  for (let { parentJob, jobID, itemID } of newJobs) {
    for (let parentJobID of parentJob) {
      let parentMatch = jobArray.find((i) => i.jobID === parentJobID);
      if (!parentMatch) continue;

      parentMatch.build.childJobs[itemID] = [
        ...new Set([...parentMatch.build.childJobs[itemID], jobID]),
      ];
    }
  }
  return jobArray;
}
