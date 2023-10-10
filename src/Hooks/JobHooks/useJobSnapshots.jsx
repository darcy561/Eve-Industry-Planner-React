import { useContext } from "react";
import { JobArrayContext } from "../../Context/JobContext";

export function useJobSnapshotManagement() {
  const { jobArray } = useContext(JobArrayContext);

  function snapshotObject(
    inputJob,
    childJobs,
    totalComplete,
    materialIDs,
    endDate,
    setupCount,
    totalSetupCount,
    totalJobCount
  ) {
    this.isLocked = false;
    this.lockedTimestamp = null;
    this.lockedUser = null;
    this.jobID = inputJob.jobID;
    this.name = inputJob.name;
    this.jobStatus = inputJob.jobStatus;
    this.jobType = inputJob.jobType;
    this.itemID = inputJob.itemID;
    this.apiJobs = [...inputJob.apiJobs];
    this.apiOrders = [...inputJob.apiOrders];
    this.apiTransactions = [...inputJob.apiTransactions];
    this.itemQuantity = inputJob.build.products.totalQuantity;
    this.totalMaterials = inputJob.build.materials.length;
    this.totalComplete = totalComplete;
    this.totalJobCount = totalJobCount;
    this.totalSetupCount = totalSetupCount;
    this.buildVer = inputJob.buildVer;
    this.parentJob = inputJob.parentJob;
    this.childJobs = childJobs;
    this.materialIDs = materialIDs;
    this.metaLevel = inputJob.metaLevel;
    this.groupID = inputJob.groupID || null;
    this.endDateDisplay = endDate;
    this.setupCount = setupCount
  }

  const replaceSnapshot = async (inputJob) => {
    const index = jobArray.findIndex((x) => inputJob.jobID === x.jobID);
    jobArray[index] = inputJob;
  };

  const deleteJobSnapshot = (inputJob, newSnapshotArray) => {
    return newSnapshotArray.filter((i) => i.jobID !== inputJob.jobID);
  };

  const newJobSnapshot = (inputJob, newSnapshotArray) => {
    const materialIDs = inputJob.build.materials.map(
      (material) => material.typeID
    );
    const childJobs = Object.values(inputJob.build.childJobs).flatMap(
      (material) => material
    );
    const totalComplete = inputJob.build.materials.filter(
      (material) => material.quantityPurchased >= material.quantity
    ).length;

    newSnapshotArray.push({
      ...new snapshotObject(
        inputJob,
        childJobs,
        totalComplete,
        materialIDs,
        null
      ),
    });

    return newSnapshotArray;
  };

  const updateJobSnapshot = (inputJob, newSnapshotArray) => {
    const materialIDs = inputJob.build.materials.map(
      (material) => material.typeID
    );
    const childJobs = Object.values(inputJob.build.childJobs).flatMap(
      (material) => material
    );
    const totalComplete = inputJob.build.materials.filter(
      (material) => material.quantityPurchased >= material.quantity
    ).length;

    const setupCount = Object.values(inputJob.build.setup).reduce((prev,) => {
      return prev +1
    }, 0)

    const tempJobs = [...inputJob.build.costs.linkedJobs];
    const endDate =
      tempJobs.length > 0
        ? Date.parse(
            tempJobs.sort(
              (a, b) => Date.parse(b.end_date) - Date.parse(a.end_date)
            )[0].end_date
          )
        : null;
    const snapshotIndex = newSnapshotArray.findIndex(
      (i) => i.jobID === inputJob.jobID
    );

    const { totalJobCount, totalSetupCount } = Object.values(
      inputJob.build.setup
    ).reduce(
      (prev, { jobCount }) => {
        return {
          totalJobCount: (prev.totalJobCount += jobCount),
          totalSetupCount: prev.totalSetupCount + 1,
        };
      },
      { totalJobCount: 0, totalSetupCount: 0 }
    );

    newSnapshotArray[snapshotIndex] = {
      ...new snapshotObject(
        inputJob,
        childJobs,
        totalComplete,
        materialIDs,
        endDate
      ),
    };
    return newSnapshotArray;
  };

  return {
    replaceSnapshot,
    deleteJobSnapshot,
    newJobSnapshot,
    updateJobSnapshot,
  };
}
