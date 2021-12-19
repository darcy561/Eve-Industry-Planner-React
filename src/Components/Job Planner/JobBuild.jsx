import { jobTypes } from ".";
import { appCheck } from "../../firebase";
import { getToken } from "firebase/app-check";

class Job {
  constructor(itemJson) {
    this.jobType = jobTypes.baseMaterial;

    if (itemJson.activities.hasOwnProperty("manufacturing") === true) {
      this.jobType = jobTypes.manufacturing;
      this.manufacturing = itemJson.activities.manufacturing;
    };

    if (itemJson.activities.hasOwnProperty("reaction") === true) {
      this.jobType = jobTypes.reaction;
      this.reaction = itemJson.activities.reaction;
    };

    if (itemJson.activities.hasOwnProperty("pi") === true) {
      this.pi = itemJson.activities.pi;
      this.jobType = jobTypes.pi;
    };

    this.name = itemJson.name;
    this.jobID = Date.now();
    this.jobStatus = 0;
    this.volume = itemJson.volume;
    this.itemID = itemJson.itemID;
    this.maxProductionLimit = itemJson.maxProductionLimit;
    this.runCount = 1;
    this.jobCount = 1;
    this.bpME = 0;
    this.bpTE = 0;
    this.structureType = 1
    this.structureTypeDisplay ="Station"
    this.rigType = 0;
    this.systemType = 1;
    this.apiJobs = [];

    this.job = {
      products: {
        totalQuantity: 0,
        quantityPerJob: 0,
        recalculate: false
      },
      costs: {
        totalPurchaseCost: 0,
        extrasCosts: [],
        extrasTotal: 0,
        installCosts: 0
      },
      sale: {
        totalSold: 0,
        totalSale: 0,
        markUp: 0,
        transactions: [],
        brokersFee:[],
      },
      materials: null,
      buildChar: null,
    };
    
    this.planner = {
      products: {
        totalQuantity: 0,
        quantityPerJob: 0,
      },
      materials: [],
    };
  };
};

export async function createJob(itemID) {
  
  try {
    const appCheckToken = await getToken(appCheck, true);
    const response = await fetch(
      `https://us-central1-eve-industry-planner-dev.cloudfunctions.net/api/item/${itemID}`, {
        headers: {
          "X-Firebase-AppCheck": appCheckToken.token,
        }
      }
    );
    const itemJson = await response.json();
    const outputObject = new Job(itemJson);
    try {
      if (outputObject.jobType === jobTypes.manufacturing) {
        outputObject.planner.materials = JSON.parse(
          JSON.stringify(outputObject.manufacturing.materials)
        );
        outputObject.planner.skills = JSON.parse(
          JSON.stringify(outputObject.manufacturing.skills)
        );
        outputObject.planner.time = JSON.parse(
          JSON.stringify(outputObject.manufacturing.time)
        );

        outputObject.job.materials = JSON.parse(
          JSON.stringify(outputObject.manufacturing.materials)
        );
        outputObject.job.materials.forEach((material) => {
          material.purchasing = [];
          material.quantityPurchased = 0;
          material.purchasedCost = 0;
          material.purchaseComplete = false;
        });
        outputObject.job.skills = JSON.parse(
          JSON.stringify(outputObject.manufacturing.skills)
        );
        outputObject.job.time = JSON.parse(
          JSON.stringify(outputObject.manufacturing.time)
        );
      } else if (outputObject.jobType === jobTypes.reaction) {
        outputObject.planner.materials = JSON.parse(
          JSON.stringify(outputObject.reaction.materials)
        );
        outputObject.planner.skills = JSON.parse(
          JSON.stringify(outputObject.reaction.skills)
        );
        outputObject.planner.time = JSON.parse(
          JSON.stringify(outputObject.reaction.time)
        );

        outputObject.job.materials = JSON.parse(
          JSON.stringify(outputObject.reaction.materials)
        );
        outputObject.job.materials.forEach((material) => {
          material.purchasing = [];
          material.quantityPurchased = 0;
          material.purchasedCost = 0;
          material.purchaseComplete = false;
        });
        outputObject.job.skills = JSON.parse(
          JSON.stringify(outputObject.reaction.skills)
        );
        outputObject.job.time = JSON.parse(
          JSON.stringify(outputObject.reaction.time)
        );
      };

      return outputObject;

    } catch (err) {
      return "objectError"
    };

  } catch (err) {
    return err.name;
  };
};
