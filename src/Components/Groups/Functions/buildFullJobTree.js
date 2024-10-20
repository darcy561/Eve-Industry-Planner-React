import checkJobTypeIsBuildable from "../../../Functions/Helper/checkJobTypeIsBuildable";
import convertJobIDsToObjects from "../../../Functions/Helper/convertJobIDsToObjects";
import retrieveJobIDsFromGroupObjects from "../../../Functions/Helper/getJobIDsFromGroupObjects";

async function buildFullJobTree(
  selectedJobIDs,
  jobArray,
  retrievedJobs,
  groupID,
  groupArray,
  applicationSettings,
  buildJobFunction,
  recalculateJob
) {
  const jobIDsIncludedInGroup = retrieveJobIDsFromGroupObjects(
    groupID,
    groupArray
  );

  const allJobObjects = await convertJobIDsToObjects(
    [...new Set([...selectedJobIDs, ...jobIDsIncludedInGroup])],
    jobArray,
    retrievedJobs
  );

  const requestedJobObjects = await convertJobIDsToObjects(
    selectedJobIDs,
    jobArray,
    retrievedJobs
  );

  const typeIDMap = buildTypeIDMap(allJobObjects, applicationSettings, groupID);

  const jobIDMap = buildJobIDMap(allJobObjects);

  const materialRequests = generateMaterialRequests(
    requestedJobObjects,
    typeIDMap,
    applicationSettings,
    groupID
  );

  const newJobs = await processMaterials(
    typeIDMap,
    jobIDMap,
    materialRequests,
    retrievedJobs,
    [...jobArray, ...retrievedJobs],
    groupID,
    buildJobFunction,
    recalculateJob,
    applicationSettings
  );

  // console.log(typeIDMap);
  // console.log(jobIDMap);
  console.log(newJobs);
  console.log(
    buildTypeIDMap([...allJobObjects, ...newJobs], applicationSettings, groupID)
  );
}

function buildTypeIDMap(inputJobs, applicationSettings, groupID) {
  const materialMap = {};

  for (const job of inputJobs) {
    const existingEntry = materialMap[job.itemID];

    const newEntry = buildTypeIDMapObject(
      job,
      undefined,
      applicationSettings,
      groupID
    );

    if (existingEntry) {
      materialMap[job.itemID] = mergeTypeIDMapEntries(existingEntry, newEntry);
    } else {
      materialMap[job.itemID] = newEntry;
    }
  }
  return materialMap;
}

function buildTypeIDMapObject(job, typeIDMap, applicationSettings, groupID) {
  const isBuildable = job.build.materials.some((material) =>
    checkMaterialIsBuildable(material, applicationSettings)
  );
  return {
    name: job.name,
    typeID: job.itemID,
    relatedJobID: job.jobID,
    quantityRequired: job.build.products.totalQuantity,
    parentJobs: new Set(job.parentJob),
    groupID: groupID,
    requiresRecalculation: false,
    buildableMaterials: isBuildable,
  };
}

function mergeTypeIDMapEntries(existingEntry, newEntry) {
  return {
    ...existingEntry,
    quantityRequired:
      existingEntry.quantityRequired + newEntry.quantityRequired, // Add quantities
    parentJobs: new Set([...existingEntry.parentJobs, ...newEntry.parentJobs]), // Merge parent jobs
    requiresRecalculation:
      existingEntry.requiresRecalculation || newEntry.requiresRecalculation, // Combine recalculation flags
    buildableMaterials:
      existingEntry.buildableMaterials || newEntry.buildableMaterials, // Merge buildable materials flag
  };
}

function buildJobIDMap(inputJobs) {
  const jobMap = {};
  for (const job of inputJobs) {
    jobMap[job.jobID] = job;
  }
  return jobMap;
}

function generateMaterialRequests(
  inputJobs,
  typeIDMap,
  applicationSettings,
  groupID
) {
  return inputJobs.flatMap((job) => {
    return job.build.materials
      .filter(
        (material) =>
          checkMaterialIsBuildable(material, applicationSettings) &&
          job.build.childJobs[material.typeID].length === 0
      )
      .map((material) => ({
        typeID: material.typeID,
        name: material.name,
        quantityRequired: material.quantity,
        groupID: groupID,
        relatedJobID: job.jobID,
      }));
  });
}

function checkMaterialIsBuildable(material, applicationSettings) {
  return (
    !applicationSettings.checkTypeIDisExempt(material.typeID) &&
    checkJobTypeIsBuildable(material.jobType)
  );
}

async function processMaterials(
  typeIDMap,
  jobIDMap,
  materialRequests,
  retrievedJobs,
  allJobObjects,
  groupID,
  buildJobFunction,
  recalculateJob,
  applicationSettings
) {
  const newJobs = [];
  const processingQueue = [...materialRequests];
  const materialsAwaitingRequest = [];

  while (processingQueue.length > 0) {
    const currentMaterial = processingQueue.shift();
    try {
      const matchedMaterial = typeIDMap[currentMaterial.typeID];
      if (matchedMaterial) {
        updateExistingItemInTypeIDMap(currentMaterial, typeIDMap);
      } else {
        manageMaterialRequestQueue(materialsAwaitingRequest, currentMaterial);
      }
      if (processingQueue.length === 0 && materialsAwaitingRequest.length > 0) {
        const newJobObjects = await retrieveNewMaterials(
          materialsAwaitingRequest,
          newJobs,
          buildJobFunction
        );
        addNewItemsToTypeIDMap(
          newJobObjects,
          typeIDMap,
          applicationSettings,
          groupID
        );
        addNewItemsToJobIDMap(newJobObjects, jobIDMap);
        materialsAwaitingRequest.length = 0;
      }
      if (
        processingQueue.length === 0 &&
        materialsAwaitingRequest.length === 0
      ) {
        recalulateExistingJobs(
          typeIDMap,
          jobIDMap,
          recalculateJob,
          applicationSettings
        );
        updateParentAndChildJobs(Object.values(jobIDMap), typeIDMap);
        const nextLevelOfRequests = generateMaterialRequests(
          Object.values(jobIDMap),
          typeIDMap,
          applicationSettings,
          groupID
        );
        processingQueue.push(...nextLevelOfRequests);
      }
    } catch (materialError) {
      console.error("error processing job:", materialError);
    }
  }
  return newJobs;
}

function updateExistingItemInTypeIDMap(inputMaterial, materialMap) {
  const matchedMaterial = materialMap[inputMaterial.typeID];
  matchedMaterial.quantityRequired += inputMaterial.quantityRequired;
  matchedMaterial.parentJobs.add(inputMaterial.relatedJobID);
  matchedMaterial.requiresRecalculation = true;
}

function manageMaterialRequestQueue(queue, newRequest) {
  const existingMaterial = queue.find((i) => i.itemID === newRequest.typeID);
  if (existingMaterial) {
    updateBuildRequest(existingMaterial, newRequest);
  } else {
    queue.push(createBuildRequest(newRequest));
  }
}

function createBuildRequest(request) {
  return {
    itemID: request.typeID,
    itemQty: request.quantityRequired,
    groupID: request.groupID,
    parentJobs: [request.relatedJobID],
  };
}

function updateBuildRequest(existingRequest, newRequest) {
  existingRequest.itemQty += newRequest.quantityRequired;
  existingRequest.parentJobs = [
    ...new Set([...existingRequest.parentJobs, newRequest.relatedJobID]),
  ];
}

async function retrieveNewMaterials(queue, newJobsStorage, buildFunction) {
  try {
    const newJobs = await buildFunction(queue);
    newJobs.forEach((i) => newJobsStorage.push(i));
    return newJobs;
  } catch (err) {
    console.error("Error retrieving jobs");
    return [];
  }
}

function addNewItemsToTypeIDMap(
  newJobs,
  typeIDMap,
  applicationSettings,
  groupID
) {
  for (const job of newJobs) {
    typeIDMap[job.itemID] = buildTypeIDMapObject(
      job,
      typeIDMap,
      applicationSettings,
      groupID
    );
  }
}
function addNewItemsToJobIDMap(newJobs, typeIDMap) {
  for (const job of newJobs) {
    typeIDMap[job.jobID] = job;
  }
}

function recalulateExistingJobs(
  typeIDMap,
  jobIDMap,
  recalculateJob,
  applicationSettings
) {
  for (const mapObject of Object.values(typeIDMap)) {
    const job = jobIDMap[mapObject.relatedJobID];
    if (!job) continue;
    if (mapObject.quantityRequired !== job.build.products.totalQuantity) {
      recalculateJob(job, mapObject.quantityRequired);
    }
    mapObject.requiresRecalculation = false;
  }
}

function updateParentAndChildJobs(allJobs, typeIDMap) {
  for (const job of allJobs) {
    job.addParentJob(typeIDMap[job.itemID]?.parentJobs);
    job.build.materials.forEach((mat) => {
      const typeIDObject = typeIDMap[mat.typeID];
      if (!typeIDObject) return;
      job.addChildJob(mat.typeID, typeIDObject.relatedJobID);
    });
  }
}

export default buildFullJobTree;
