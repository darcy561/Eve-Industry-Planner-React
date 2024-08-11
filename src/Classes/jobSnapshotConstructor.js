import { getString } from "firebase/remote-config";
import { remoteConfig } from "../firebase";

const remoteAppVersion = getString(remoteConfig, "app_version_number");

class JobSnapshot {
  constructor(input = {}) {
    if (input.build) {
      this.setSnapshot(input);
    } else {
      const {
        isLocked = false,
        lockedTimestamp = null,
        lockedUser = null,
        jobID = "",
        name = "",
        jobStatus = 0,
        jobType = 1,
        itemID = 0,
        apiJobs = [],
        apiOrders = [],
        apiTransactions = [],
        itemQuantity = 0,
        totalMaterials = 0,
        totalComplete = 0,
        totalJobCount = 0,
        totalSetupCount = 0,
        buildVer = remoteAppVersion,
        parentJob = [],
        childJobs = [],
        materialIDs = [],
        metaLevel = 0,
        groupID = null,
        endDateDisplay = null,
      } = input;

      this.isLocked = isLocked;
      this.lockedTimestamp = lockedTimestamp;
      this.lockedUser = lockedUser;
      this.jobID = jobID.toString();
      this.name = name;
      this.jobStatus = jobStatus;
      this.jobType = jobType;
      this.itemID = itemID;
      this.apiJobs = new Set(apiJobs);
      this.apiOrders = new Set(apiOrders);
      this.apiTransactions = new Set(apiTransactions);
      this.itemQuantity = itemQuantity;
      this.totalMaterials = totalMaterials;
      this.totalComplete = totalComplete;
      this.totalJobCount = totalJobCount;
      this.totalSetupCount = totalSetupCount;
      this.buildVer = buildVer;
      this.parentJob = new Set(parentJob.map(String));
      this.childJobs = new Set(childJobs.map(String));
      this.materialIDs = new Set(materialIDs);
      this.metaLevel = metaLevel;
      this.groupID = groupID;
      this.endDateDisplay = endDateDisplay;
    }
  }

  toDocument() {
    return {
      isLocked: this.isLocked,
      lockedTimestamp: this.lockedTimestamp,
      lockedUser: this.lockedUser,
      jobID: this.jobID,
      name: this.name,
      jobStatus: this.jobStatus,
      jobType: this.jobType,
      itemID: this.itemID,
      apiJobs: Array.from(this.apiJobs),
      apiOrders: Array.from(this.apiOrders),
      apiTransactions: Array.from(this.apiTransactions),
      itemQuantity: this.itemQuantity,
      totalMaterials: this.totalMaterials,
      totalComplete: this.totalComplete,
      totalJobCount: this.totalJobCount,
      totalSetupCount: this.totalSetupCount,
      buildVer: this.buildVer,
      parentJob: Array.from(this.parentJob),
      childJobs: Array.from(this.childJobs),
      materialIDs: Array.from(this.materialIDs),
      metaLevel: this.metaLevel,
      groupID: this.groupID,
      endDateDisplay: this.endDateDisplay,
    };
  }

  setSnapshot(inputJob) {
    const {
      jobID,
      name,
      jobStatus,
      jobType,
      itemID,
      apiJobs,
      apiOrders,
      apiTransactions,
      buildVer,
      parentJob,
      metaLevel,
      groupID,
      build,
    } = inputJob;

    this.isLocked = false;
    this.lockedTimestamp = null;
    this.lockedUser = null;
    this.jobID = jobID.toString();
    this.name = name;
    this.jobStatus = jobStatus;
    this.jobType = jobType;
    this.itemID = itemID;
    this.apiJobs = new Set(apiJobs);
    this.apiOrders = new Set(apiOrders);
    this.apiTransactions = new Set(apiTransactions);
    this.itemQuantity = build.products.totalQuantity;
    this.totalMaterials = build.materials.length;
    this.buildVer = buildVer || remoteAppVersion;
    this.parentJob = new Set(parentJob.map(String));
    this.metaLevel = metaLevel;
    this.groupID = groupID;

    this.materialIDs = new Set(
      build.materials.map((material) => material.typeID)
    );
    this.childJobs = new Set(Object.values(build.childJobs).flat());

    this.totalComplete = build.materials.filter(
      (material) => material.quantityPurchased >= material.quantity
    ).length;

    const tempJobs = build.costs.linkedJobs || [];
    this.endDateDisplay = tempJobs.length
      ? Date.parse(
          tempJobs.reduce((latest, job) =>
            Date.parse(job.end_date) > Date.parse(latest.end_date)
              ? job
              : latest
          ).end_date
        )
      : null;

    const { totalJobCount, totalSetupCount } = Object.values(
      build.setup
    ).reduce(
      (acc, { jobCount }) => ({
        totalJobCount: acc.totalJobCount + jobCount,
        totalSetupCount: acc.totalSetupCount + 1,
      }),
      { totalJobCount: 0, totalSetupCount: 0 }
    );
    this.totalJobCount = totalJobCount;
    this.totalSetupCount = totalSetupCount;
  }
  lockSnapshot(CharacterHash) {
    if (!CharacterHash) return;
    this.isLocked = true;
    this.lockedTimestamp = Date.now();
    this.lockedUser = CharacterHash;
  }
  unlockSnapshot() {
    this.isLocked = false;
    this.lockedTimestamp = null;
    this.lockedUser = null;
  }
  getPriceRequest() {
    return [this.itemID, ...this.materialIDs];
  }
  getRelatedJobs() {
    return [...this.childJobs, ...this.parentJob];
  }
}

export default JobSnapshot;
