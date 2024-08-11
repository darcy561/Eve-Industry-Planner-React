import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import { useJobBuild } from "../useJobBuild";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";
import { ApplicationSettingsContext } from "../../Context/LayoutContext";
import addNewJobToFirebase from "../../Functions/Firebase/addNewJob";
import updateJobInFirebase from "../../Functions/Firebase/updateJob";
import findOrGetJobObject from "../../Functions/Helper/findJobObject";

export function useBuildChildJobs() {
  const { jobArray, groupArray, updateJobArray, updateGroupArray } =
    useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const { buildJob } = useJobBuild();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();

  async function buildChildJobs(inputJobIDs) {
    const newGroupArray = [...groupArray];
    const groupObject = newGroupArray.find((i) => i.groupID === activeGroup);

    const existingGroupData = await calculateExistingTypeIDs();
    const { buildRequests, jobsToBeModified } = await calculateNeededJobs(
      inputJobIDs,
      existingGroupData
    );
    const newJobData = await buildJob(buildRequests);

    const newJobArray = await buildNewJobArray(newJobData, jobsToBeModified);

    groupObject.addJobsToGroup(newJobData);

    updateGroupArray(newGroupArray);
    updateJobArray(newJobArray);

    if (jobsToBeModified.length > 0 && buildRequests.length > 0) {
      sendSnackbarNotificationSuccess(
        `${jobsToBeModified.length} Jobs Updated & ${buildRequests.length} Jobs Created`,
        3
      );
    }
    if (buildRequests.length > 0) {
      sendSnackbarNotificationSuccess(
        `${buildRequests.length} Jobs Created`,
        3
      );
    }
    if (jobsToBeModified.length > 0) {
      sendSnackbarNotificationSuccess(
        `${jobsToBeModified.length} Jobs Updated `,
        3
      );
    }
    if (jobsToBeModified.length === 0 && buildRequests.length === 0) {
      sendSnackbarNotificationSuccess(`Job Tree Complete`, 3);
    }
  }

  async function calculateExistingTypeIDs() {
    const resultMap = new Map();

    const selectedGroupObject = groupArray.find(
      (i) => i.groupID === activeGroup
    );

    for (const jobID of [...selectedGroupObject.includedJobIDs]) {
      const job = await findOrGetJobObject(jobID, jobArray);

      if (!job) {
        continue;
      }

      const childJobData = job.build.materials.reduce((output, material) => {
        if (applicationSettings.checkTypeIDisExempt(material.typeID)) {
          return output;
        }
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
      const requestedJob = await findOrGetJobObject(inputJobID, jobArray);
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
        if (applicationSettings.checkTypeIDisExempt(material.typeID)) {
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
        await addNewJobToFirebase(job);
      }
    }

    newJobArray = linkNewJobsToParent(newJobData, newJobArray);

    for (let modifiedData of jobsToBeModified) {
      let job = newJobArray.find((i) => i.jobID === modifiedData.jobID);

      if (!job) {
        continue;
      }
      job.parentJob = [...new Set(job.parentJob, [...modifiedData.parentJobs])];

      recalculateJobForNewTotal(job, modifiedData.itemQty);

      if (isLoggedIn) {
        updateJobInFirebase(job);
      }
    }

    return newJobArray;
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

  return {
    buildChildJobs,
  };
}
