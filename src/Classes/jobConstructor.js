import uuid from "react-uuid";
import { jobTypes } from "../Context/defaultValues";
import Setup from "./jobSetupConstructor";
import LinkedESIJob from "./linkedESIJobConstructor";

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
      localMarketDisplay: itemJson?.localMarketDisplay || null,
      localOrderDisplay: itemJson?.localOrderDisplay || null,
      esiJobTab: itemJson?.esiJobTab || null,
      setupToEdit: itemJson?.setupToEdit || null,
      resourceDisplayType: itemJson?.resourceDisplayType || null,
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
