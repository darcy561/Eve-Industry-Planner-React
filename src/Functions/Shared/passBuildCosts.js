import uuid from "react-uuid";
import findOrGetJobObject from "../Helper/findJobObject";
import updateJobInFirebase from "../Firebase/updateJob";

async function passBuildCostsToParentJobs(
  jobsToPass,
  jobArray,
  userJobSnapshot,
  retrievedJobs
) {
  if (!Array.isArray(jobsToPass)) {
    jobsToPass = [jobsToPass];
  }

  const { collectedMaterials, parentJobMap } =
    collectMaterialsAndParentJobs(jobsToPass);

  const parentJobs = await findNeededParentJobs(
    parentJobMap,
    jobArray,
    retrievedJobs
  );

  distributeItemsBetweenParentJobs(
    collectedMaterials,
    parentJobs,
    parentJobMap,
    userJobSnapshot
  );
  await saveModifiedJobsToDatabase(parentJobs);
}

function collectMaterialsAndParentJobs(chosenJobs) {
  const collectedMaterials = {};
  const parentJobMap = {};

  for (let job of chosenJobs) {
    const materialID = job.itemID;
    const quantity = job.build.products.totalQuantity;
    const itemCost = job.totalCostPerItem();

    if (!collectedMaterials[materialID]) {
      collectedMaterials[materialID] = {
        totalQuantity: 0,
        costs: [],
      };
    }

    collectedMaterials[materialID].totalQuantity += quantity;

    const existingCostEntry = collectedMaterials[materialID].costs.find(
      (i) => i.cost === itemCost
    );

    if (existingCostEntry) {
      existingCostEntry.totalQuantity += quantity;
    } else {
      collectedMaterials[materialID].costs.push({
        id: job.jobID,
        cost: itemCost,
        quantity,
      });
    }

    for (const parentID of job.parentJob) {
      if (!parentJobMap[materialID]) {
        parentJobMap[materialID] = new Set();
      }

      parentJobMap[materialID].add(parentID);
    }
  }
  return { collectedMaterials, parentJobMap };
}

async function findNeededParentJobs(parentMap, jobArray, retrievedJobs) {
  const parentJobs = [];
  const parentJobPromises = [];

  for (const parentIDs of Object.values(parentMap)) {
    for (const parentID of parentIDs) {
      parentJobPromises.push(
        findOrGetJobObject(parentID, jobArray, retrievedJobs)
      );
    }
  }

  const resolvedPromises = await Promise.allSettled(parentJobPromises);

  for (const result of resolvedPromises) {
    if (
      result.status === "fulfilled" &&
      result.value &&
      !parentJobs.some((i) => i.jobID === result.value.jobID)
    ) {
      parentJobs.push(result.value);
    }
  }

  return parentJobs;
}

function distributeItemsBetweenParentJobs(
  collectedMaterials,
  parentJobs,
  parentMap,
  userJobSnapshot
) {
  let successfulParentImportCount = 0;

  for (const parentJob of parentJobs) {
    for (const materialID of Object.keys(collectedMaterials)) {
      if (!parentMap[materialID]?.has(parentJob.jobID)) continue;

      const material = parentJob.build.materials.find(
        (i) => i.typeID == materialID
      );
      if (!material) continue;
      const materialToImport = collectedMaterials[materialID];
      if (!materialToImport) continue;

      let remainingQuantityToPurchase =
        material.quantity - material.quantityPurchased;

      for (const costEntry of materialToImport.costs) {
        if (remainingQuantityToPurchase <= 0) break;

        if (costEntry.quantity <= 0) continue;

        if (isMaterialPurchased(material, costEntry.id, parentJob)) continue;

        const quantityAvailableToPurchase = Math.min(
          remainingQuantityToPurchase,
          costEntry.quantity
        );
        if (quantityAvailableToPurchase > 0) {
          addPurchaseToMaterial(
            material,
            quantityAvailableToPurchase,
            costEntry.id,
            costEntry.cost
          );
          costEntry.quantity -= quantityAvailableToPurchase;
          remainingQuantityToPurchase -= quantityAvailableToPurchase;


          if (costEntry.quantity <= 0) {
            costEntry.quantity = 0;
          }
        }
      }
    }
    successfulParentImportCount++
    parentJob.updateJobSnapshot(userJobSnapshot);
  }
}

async function saveModifiedJobsToDatabase(parentJobs) {
  const promises = parentJobs.map((job) => updateJobInFirebase(job));

  await Promise.allSettled(promises);
}

function isMaterialPurchased(material, jobID, parentJob) {
  return (
    material.purchasing.some((i) => i.childID === jobID) &&
    parentJob.build.childJobs[material.typeID]?.includes(jobID)
  );
}

function addPurchaseToMaterial(material, quantity, jobID, itemCost) {
  material.purchasing.push({
    id: uuid(),
    childID: jobID,
    childJobImport: true,
    itemCount: quantity,
    itemCost: itemCost,
  });

  material.quantityPurchased += quantity;
  material.purchasedCost += quantity * itemCost;

  if (material.quantityPurchased >= material.quantity) {
    material.purchaseComplete = true;
  }
}

export default passBuildCostsToParentJobs;
