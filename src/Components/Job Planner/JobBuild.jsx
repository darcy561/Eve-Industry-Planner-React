import { jobTypes } from ".";
import { appCheck } from "../../firebase";
import { getToken } from "firebase/app-check";

class Job {
  constructor(itemJson, sisiData) {
    this.buildVer = process.env.REACT_APP_Version;
    this.metaLevel = itemJson.metaGroup || null;
    this.jobType = itemJson.jobType;
    if (sisiData) {
      this.name = `${itemJson.name} (Singularity)`  
    } else {
      this.name = itemJson.name;
    }
    this.jobID = Date.now();
    this.jobStatus = 0;
    this.volume = itemJson.volume;
    this.itemID = itemJson.itemID;
    this.maxProductionLimit = itemJson.maxProductionLimit;
    this.runCount = 1;
    this.jobCount = 1;
    this.bpME = 0;
    this.bpTE = 0;
    this.rigType = 0;
    this.systemType = 1;
    this.apiJobs = [];
    this.apiOrders = [];
    this.apiTransactions = [];
    this.parentJob = [];
    this.blueprintTypeID = itemJson.blueprintTypeID || null;
    this.projectID = null
    this.build = {
      products: {
        totalQuantity: 0,
        quantityPerJob: 0,
      },
      costs: {
        totalPurchaseCost: 0,
        extrasCosts: [],
        extrasTotal: 0,
        linkedJobs: [],
        installCosts: 0,
        inventionCosts: 0,
        inventionEntries: [],

      },
      sale: {
        totalSold: 0,
        totalSale: 0,
        markUp: 0,
        marketOrders: [],
        transactions: [],
        brokersFee: [],
      },
      materials: null,
      buildChar: null,
      sisiData: sisiData,
    };
    this.rawData = {};
    this.layout = {
      localMarketDisplay: null,
      localOrderDisplay: null,
      esiJobTab: null
    }

    if (itemJson.jobType === jobTypes.manufacturing) {
      this.rawData.materials = itemJson.activities.manufacturing.materials;
      this.rawData.products = itemJson.activities.manufacturing.products;
      this.rawData.time = itemJson.activities.manufacturing.time;
      this.structureType = 0;
      this.structureTypeDisplay = "Station";
      this.skills = itemJson.activities.manufacturing.skills;
      this.build.materials = JSON.parse(
        JSON.stringify(itemJson.activities.manufacturing.materials)
      );
      this.build.time = JSON.parse(
        JSON.stringify(itemJson.activities.manufacturing.time)
      );
    }

    if (itemJson.jobType === jobTypes.reaction) {
      this.rawData.materials = itemJson.activities.reaction.materials;
      this.rawData.products = itemJson.activities.reaction.products;
      this.rawData.time = itemJson.activities.reaction.time;
      this.structureType = 1;
      this.structureTypeDisplay = "Medium";
      this.skills = itemJson.activities.reaction.skills;
      this.build.materials = JSON.parse(
        JSON.stringify(itemJson.activities.reaction.materials)
      );
      this.build.time = JSON.parse(
        JSON.stringify(itemJson.activities.reaction.time)
      );
    }

    if (itemJson.jobType === jobTypes.pi) {
      this.rawData = itemJson.activities.pi;
    }
  }
}

export async function createJob(itemID, sisiData) {
  try {
    const appCheckToken = await getToken(appCheck, true);
    const response = await fetch(
      sisiData
        ? `${process.env.REACT_APP_APIURL}/item/sisiData/${itemID}`
        : `${process.env.REACT_APP_APIURL}/item/${itemID}`,
      {
        headers: {
          "X-Firebase-AppCheck": appCheckToken.token,
        },
      }
    );
    const itemJson = await response.json();
    const outputObject = new Job(itemJson, sisiData);
    try {
      outputObject.build.materials.forEach((material) => {
        material.purchasing = [];
        material.quantityPurchased = 0;
        material.purchasedCost = 0;
        material.purchaseComplete = false;
        material.childJob = [];
      });
      outputObject.build.materials.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

      return outputObject;
    } catch (err) {
      return "objectError";
    }
  } catch (err) {
    return err.name;
  }
}
