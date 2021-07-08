import React from "react";
import { jobTypes } from ".";

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
    this.jobStatus = 1;
    this.volume = itemJson.volume;
    this.itemID = itemJson.itemID;
    this.iconID = itemJson.itemID + "_64";
    this.maxProductionLimit = itemJson.maxProductionLimit;
    this.runCount = 0;
    this.jobCount = 0;
    this.bpME = null;
    this.bpTE = null;
    this.structureType = 1
    this.structureTypeDisplay =""
    this.rigType = null;
    this.systemType = 0;

    this.job = {
      products: {
        totalQuantity: 0,
        quantityPerJob: 0,
      },
      materials: 0,
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

async function createJob(itemID) {
  try {
    const response = await fetch(
      `https://us-central1-eve-industry-planner-dev.cloudfunctions.net/app/api/item/${itemID}`
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
        outputObject.job.skills = JSON.parse(
          JSON.stringify(outputObject.reaction.skills)
        );
        outputObject.job.time = JSON.parse(
          JSON.stringify(outputObject.reaction.time)
        );
      };

      return outputObject;

    } catch (err) {
      alert("Error Building Job Object");
      console.log(err);
    };

  } catch (err) {
    alert("No blueprint attached to this item");
  };
};
export { createJob };
