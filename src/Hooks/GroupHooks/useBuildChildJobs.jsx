import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import ka from "date-fns/locale/ka/index";

export function useBuildChildJobs() {
  const { jobArray, groupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { findJobData } = useFindJobObject();

  const buildChildJobsNew = async (inputJobIDs) => {
    let currentTypeIDData = await calculateExistingTypeIDs();
    console.log(currentTypeIDData);
    let { requestList, jobsToBeModified } = await calculateNeededJobs(
      inputJobIDs,
      currentTypeIDData
    );
    console.log(requestList);
    console.log(jobsToBeModified);
  };

  const calculateExistingTypeIDs = async () => {
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
  };

  const calculateNeededJobs = async (requestedJobIDs, existingTypeIDData) => {
    let requestList = [];
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
        handleExistingID(
          inputJobID,
          material,
          existingTypeIDData,
          jobsToBeModified
        );
        handleModifiedID(
          inputJobID,
          material,
          existingTypeIDData,
          jobsToBeModified
        );
        handleBuildRequests(inputJobID, material, requestList);
      });
    }

    return { requestList, jobsToBeModified };
  };

  function calculateQuantities(materialQuantity, dataSetLength) {
    const evenQuantity = Math.floor(materialQuantity / dataSetLength);
    const remainingQuantity = materialQuantity % dataSetLength;
    return { evenQuantity, remainingQuantity };
  }

  function handleExistingID(
    requestedJobID,
    material,
    existingData,
    jobsToBeModified
  ) {
    if (!existingData.some((i) => i.itemID === material.typeID)) return;
    let matchingData = existingData.filter((i) => i.itemID === material.typeID);
    const { evenQuantity, remainingQuantity } = calculateQuantities(
      material.quantity,
      matchingData.length
    );
    for (let dataSet of matchingData) {
      console.log(dataSet);
      dataSet.itemQty += evenQuantity;
      dataSet.parentJobIDs.add(requestedJobID);
    }
    matchingData[0].itemQty += remainingQuantity;
    jobsToBeModified = jobsToBeModified.concat(matchingData);
    existingData = existingData.filter((i) => i.itemID !== material.typeID);
    console.log(existingData) 
  }

  function handleModifiedID(
    requestedJobID,
    material,
    existingData,
    jobsToBeModified
  ) {
    let matchingData = jobsToBeModified.filter(
      (i) => i.itemID === material.typeID
    );
    if (matchingData.length === 0) return;

    const { evenQuantity, remainingQuantity } = calculateQuantities(
      material.quantity,
      matchingData.length
    );

    for (let dataSet of matchingData) {
      dataSet.itemQty += evenQuantity;
      dataSet.parentJobs.add(requestedJobID);
    }
    matchingData[0].itemQty += remainingQuantity;
    jobsToBeModified = jobsToBeModified.filter(
      (i) => i.itemID !== material.typeID
    );
    jobsToBeModified = jobsToBeModified.concat(matchingData);
  }

  function handleBuildRequests(requestedJobID, material, buildRequests) {
    let buildObject = buildRequests.find((i) => i.itemID === material.typeID);

    if (!buildObject) {
      buildRequests.push({
        name: material.name,
        itemID: material.typeID,
        itemQty: material.quantity,
        parentJobs: new Set([requestedJobID]),
        childJobs: [],
        groupID: activeGroup.groupID,
      });
    } else {
      buildObject.parentJobs.add(requestedJobID);
      buildObject.itemQty += material.quantity;
    }
  }
  return {
    buildChildJobsNew,
  };
}
