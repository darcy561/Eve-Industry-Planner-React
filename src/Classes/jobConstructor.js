import uuid from "react-uuid";
import { jobTypes } from "../Context/defaultValues";
import Setup from "./jobSetupConstructor";
import LinkedESIJob from "./linkedESIJobConstructor";
import JobSnapshot from "./jobSnapshotConstructor";

class Job {
  constructor(itemJson, buildRequest) {
    this.buildVer = itemJson?.buildVer || __APP_VERSION__;
    this.metaLevel = itemJson?.metaGroup || null;
    this.jobType = itemJson.jobType;
    this.name = itemJson.name;
    this.jobID = itemJson?.jobID || `job-${uuid()}`;
    this.jobStatus = itemJson?.jobStatus || 0;
    this.volume = itemJson.volume;
    this.itemID = itemJson.itemID;
    this.maxProductionLimit = itemJson.maxProductionLimit;
    this.apiJobs = new Set(itemJson?.apiJobs || []);
    this.apiOrders = new Set(itemJson?.apiOrders || []);
    this.apiTransactions = new Set(itemJson?.apiTransactions || []);
    this.parentJob = itemJson?.parentJob || buildRequest?.parentJobs || [];
    this.blueprintTypeID = itemJson?.blueprintTypeID || null;
    this.groupID = itemJson?.groupID || buildRequest?.groupID || null;
    this.isReadyToSell = itemJson?.isReadyToSell || false;
    this.build = {
      setup: documentToSetups(itemJson),
      products: {
        totalQuantity: itemJson?.build?.products?.totalQuantity || 0,
      },
      childJobs: itemJson?.build?.childJobs || {},
      costs: {
        totalPurchaseCost: itemJson?.build?.costs?.totalPurchaseCost || 0,
        extrasCosts: itemJson?.build?.costs?.extrasCosts || [],
        extrasTotal: itemJson?.build?.costs?.extrasTotal || 0,
        linkedJobs: itemJson?.build?.costs?.linkedJobs || [],
        installCosts: itemJson?.build?.costs?.installCosts || 0,
        inventionCosts: itemJson?.build?.costs?.inventionCosts || 0,
        inventionEntries: itemJson?.build?.costs?.inventionEntries || [],
      },
      sale: {
        totalSold: itemJson?.build?.sale?.totalSold || 0,
        totalSale: itemJson?.build?.sale?.totalSale || 0,
        marketOrders: itemJson?.build?.sale?.marketOrders || [],
        transactions: itemJson?.build?.sale?.transactions || [],
        brokersFee: itemJson?.build?.sale?.brokersFee || [],
      },
      materials: itemJson?.build?.materials || null,
    };
    this.rawData = itemJson?.rawData || {};
    this.skills = itemJson?.skills || [];
    this.itemsProducedPerRun = itemJson?.itemsProducedPerRun || 0;
    this.deleted = itemJson?.deleted || false;
    this.deletedTimeStamp = itemJson?.deletedTimeStamp || null;
    this.archived = itemJson?.archived || false;
    this.archiveProcessed = itemJson?.archiveProcessed || false;
    this.layout = {
      localMarketDisplay: itemJson?.layout?.localMarketDisplay || null,
      localOrderDisplay: itemJson?.layout?.localOrderDisplay || null,
      esiJobTab: itemJson?.layout?.esiJobTab || null,
      setupToEdit: itemJson?.layout?.setupToEdit || null,
      resourceDisplayType: itemJson?.layout?.resourceDisplayType || null,
    };
  }
  buildJobObject(itemJson, buildRequest) {
    if (itemJson.jobType === jobTypes.manufacturing) {
      this.rawData.materials = itemJson.activities.manufacturing.materials;
      this.rawData.products = itemJson.activities.manufacturing.products;
      this.rawData.time = itemJson.activities.manufacturing.time;
      this.skills = itemJson.activities.manufacturing.skills || [];
      this.build.materials = JSON.parse(
        JSON.stringify(itemJson.activities.manufacturing.materials)
      );
      this.itemsProducedPerRun =
        itemJson.activities.manufacturing.products[0].quantity;
    }
    if (itemJson.jobType === jobTypes.reaction) {
      this.rawData.materials = itemJson.activities.reaction.materials;
      this.rawData.products = itemJson.activities.reaction.products;
      this.rawData.time = itemJson.activities.reaction.time;
      this.skills = itemJson.activities.reaction.skills || [];
      this.build.materials = JSON.parse(
        JSON.stringify(itemJson.activities.reaction.materials)
      );
      this.itemsProducedPerRun =
        itemJson.activities.reaction.products[0].quantity;
    }

    this.build.materials.forEach((material) => {
      material.purchasing = [];
      material.quantityPurchased = 0;
      material.purchasedCost = 0;
      material.purchaseComplete = false;
      const buildItem = buildRequest?.childJobs?.find(
        (i) => i.typeID === material.typeID
      );

      this.build.childJobs[material.typeID] = buildItem?.childJobs
        ? [...buildItem.childJobs]
        : [];
    });

    this.layout.setupToEdit = Object.keys(this.build.setup)[0];
    this.build.materials.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  toDocument() {
    return {
      buildVer: this.buildVer,
      metaLevel: this.metaLevel,
      jobType: this.jobType,
      name: this.name,
      jobID: this.jobID,
      jobStatus: this.jobStatus,
      volume: this.volume,
      itemID: this.itemID,
      maxProductionLimit: this.maxProductionLimit,
      apiJobs: [...this.apiJobs],
      apiOrders: [...this.apiOrders],
      apiTransactions: [...this.apiTransactions],
      parentJob: this.parentJob,
      blueprintTypeID: this.blueprintTypeID,
      groupID: this.groupID,
      isReadyToSell: this.isReadyToSell,
      build: {
        ...this.build,
        setup: Object.entries(this.build.setup).reduce((acc, [key, value]) => {
          acc[key] = value.toDocument();
          return acc;
        }, {}),
      },
      rawData: this.rawData,
      skills: this.skills,
      itemsProducedPerRun: this.itemsProducedPerRun,
      layout: {
        localMarketDisplay: this.layout.localMarketDisplay,
        localOrderDisplay: this.layout.localOrderDisplay,
        esiJobTab: this.layout.esiJobTab,
        setupToEdit: this.layout.setupToEdit,
        resourceDisplayType: this.layout.resourceDisplayType,
      },
      deleted: this.deleted,
      deletedTimeStamp: this.deletedTimeStamp,
      archived: this.archived,
      archiveProcessed: this.archiveProcessed,
    };
  }
  getRelatedJobs() {
    return [...this.parentJob, ...Object.values(this.build.childJobs).flat()];
  }
  getAllChildJobs() {
    return Object.values(this.build.childJobs).flat();
  }
  getMaterialIDs() {
    return [this.itemID, ...Object.keys(this.build.childJobs).map(Number)];
  }
  getSystemIndexes() {
    return [
      ...Object.values(this.build.setup).reduce((prev, { systemID }) => {
        return prev.add(systemID);
      }, new Set()),
    ];
  }
  stepForward() {
    this.jobStatus++;
  }
  stepBackward() {
    this.jobStatus--;
  }
  setJobStatus(statusID) {
    if (!statusID || !isNaN(statusID)) return;
    this.jobStatus = Number(statusID);
  }
  linkESIJob(esiJob, jobOwner) {
    if (!esiJob || !jobOwner) return;
    if (
      isNaN(this.build.costs.installCosts) ||
      this.build.costs.installCosts < 0
    ) {
      this.build.costs.installCosts = this.build.costs.linkedJobs.reduce(
        (prev, job) => (prev += job.cost),
        0
      );
    }
    this.apiJobs.add(esiJob.job_id);
    this.build.costs.linkedJobs.push({ ...new LinkedESIJob(esiJob, jobOwner) });
    this.build.costs.installCosts += esiJob.cost;
  }
  unlinkESIJob(linkedJob) {
    if (!linkedJob) return;
    if (
      isNaN(this.build.costs.installCosts) ||
      this.build.costs.installCosts < 0
    ) {
      this.build.costs.installCosts = this.build.costs.linkedJobs.reduce(
        (prev, job) => (prev += job.cost),
        0
      );
    }
    this.apiJobs.delete(linkedJob.job_id);
    this.build.costs.linkedJobs = this.build.costs.linkedJobs.filter(
      (i) => i.job_id !== linkedJob.job_id
    );
    this.build.costs.installCosts -= linkedJob.cost;
  }
  addExtrasCost(newItem) {
    if (!newItem) return;
    this.build.costs.extrasCosts.push(newItem);
    this.build.costs.extrasTotal += newItem.extraValue;
  }
  removeExtrasCost(item) {
    if (!item) return;
    this.build.costs.extrasCosts = this.build.costs.extrasCosts.filter(
      (i) => i.id !== item.id
    );
    this.build.costs.extrasTotal -= item.extraValue;
  }
  addInventionCost(inputObject) {
    if (!inputObject) return;
    this.build.costs.inventionEntries.push(inputObject);
    this.build.costs.inventionCosts += inputObject.itemCost;
    this.build.costs.totalPurchaseCost += totalPurchaseCost;
  }
  removeInventionCost(inputObject) {
    if (!inputObject) return;
    this.build.costs.inventionEntries =
      this.build.costs.inventionEntries.filter((i) => i.id !== inputObject.id);
    this.build.costs.inventionCosts -= inputObject.itemCost;
    this.build.costs.totalPurchaseCost -= inputObject.itemCost;
  }
  setupCount() {
    return Object.values(this.build.setup).length;
  }
  totalCompletedMaterials() {
    return this.build.materials.filter((material) => material.purchaseComplete)
      .length;
  }
  totalRemainingMaterials() {
    return this.build.materials.filter((material) => !material.purchaseComplete)
      .length;
  }
  totalJobCount() {
    return Object.values(this.build.setup).reduce((prev, { jobCount }) => {
      return (prev += jobCount);
    }, 0);
  }
  totalCostPerItem() {
    return (
      Math.round(
        ((this.build.costs.extrasTotal +
          this.build.costs.installCosts +
          this.build.costs.totalPurchaseCost) /
          this.build.products.totalQuantity +
          Number.EPSILON) *
          100
      ) / 100
    );
  }
  removeChildJob(materialTypeID, childIDToRemove) {
    if (!materialTypeID || !childIDToRemove) {
      console.error(
        `Missing input data: materialTypeID=${materialTypeID}, childIDToRemove=${childIDToRemove}`
      );

      return;
    }
    const childLocation = this.build.childJobs[materialTypeID];

    if (!childLocation) {
      console.error(`Material not present: materialTypeID=${materialTypeID}`);
      return;
    }

    const childrenToRemove =
      Array.isArray(childIDToRemove) || childIDToRemove instanceof Set
        ? [...childIDToRemove]
        : [childIDToRemove];

    this.build.childJobs[materialTypeID] = childLocation.filter(
      (i) => !childrenToRemove.includes(i)
    );
  }

  addChildJob(materialTypeID, childIDToAdd) {
    if (!materialTypeID || !childIDToAdd) {
      console.error(
        `Missing input data: materialTypeID=${materialTypeID}, childIDToAdd=${childIDToAdd}`
      );
      return;
    }
    const childLocation = this.build.childJobs[materialTypeID];

    if (!childLocation) {
      console.error(`Material not present: materialTypeID=${materialTypeID}`);
      return;
    }

    const childrenToAdd =
      Array.isArray(childIDToAdd) || childIDToAdd instanceof Set
        ? [...childIDToAdd]
        : [childIDToAdd];

    this.build.childJobs[materialTypeID] = [
      ...new Set([...childLocation, ...childrenToAdd]),
    ];
  }

  addParentJob(parentJobID) {
    if (!parentJobID) {
      console.error("Missing Input ID");
      return;
    }

    const parentsToAdd =
      Array.isArray(parentJobID) || parentJobID instanceof Set
        ? [...parentJobID]
        : [parentJobID];

    this.parentJob = [...new Set([...this.parentJob, ...parentsToAdd])];
  }

  removeParentJob(parentJobID) {
    if (!parentJobID) {
      console.error("Missing Input ID");
      return;
    }

    const parentsToRemove =
      Array.isArray(parentJobID) || parentJobID instanceof Set
        ? [...parentJobID]
        : [parentJobID];

    this.parentJob = this.parentJob.filter(
      (id) => !parentsToRemove.includes(id)
    );
  }

  updateJobSnapshot(snapshotArray) {
    if (!snapshotArray && Array.isArray(snapshotArray)) {
      console.error("Snapshot array not provided or is not an array.");
      return;
    }

    const index = snapshotArray.findIndex((i) => i.jobID === this.jobID);

    if (index === -1) {
      console.warn("Nothing to update, job is not present in snapshot array.");
      return;
    }

    snapshotArray[index] = new JobSnapshot(this);
  }

  addPurchaseCostToMaterial(materialID, purchaseObject) {
    if (!materialID || !purchaseObject) {
      console.error("Material ID or Purchase object missing");
      return;
    }
    const material = this.build.materials.find((i) => i.typeID == materialID);
    if (!material) return;

    material.purchasing.push(purchaseObject);
    material.quantityPurchased += purchaseObject.itemCount;
    material.purchasedCost +=
      purchaseObject.itemCost * purchaseObject.itemCount;

    if (material.quantityPurchased >= material.quantity) {
      material.purchaseComplete = true;
    }
    this.build.costs.totalPurchaseCost +=
      purchaseObject.itemCost * purchaseObject.itemCount;
  }
}

function documentToSetups(object) {
  if (!object?.build?.setup) {
    return {};
  }

  return Object.values(object.build.setup).reduce((acc, value) => {
    acc[value.id] = new Setup(value);
    return acc;
  }, {});
}

export default Job;
