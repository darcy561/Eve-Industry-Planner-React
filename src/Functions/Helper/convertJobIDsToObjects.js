import findOrGetJobObject from "./findJobObject";

async function convertJobIDsToObjects(inputItem, jobArray, retrievedJobs) {
  if (!inputItem || !jobArray || !retrievedJobs) {
    console.error("Unable to convert job ids with missing inputs");
    return;
  }
  const promises = [];
  const foundObjects = [];
  const encounteredJobIDs = new Set();

  if (Array.isArray(inputItem) || inputItem instanceof Set) {
    for (const item of inputItem) {
      if (typeof item === "string") {
        if (!item.includes("job") || encounteredJobIDs.has(item)) continue;
        promises.push(findOrGetJobObject(item, jobArray, retrievedJobs));
      }
      if (typeof item === "object") {
        if (encounteredJobIDs.has(item.jobID)) continue;
        foundObjects.push(item);
      }
    }
  } else {
    if (typeof inputItem === "string") {
      if (!inputItem.includes("job")) return foundObjects;
      promises.push(findOrGetJobObject(inputItem, jobArray, retrievedJobs));
    }
    if (typeof inputItem === "object") {
      foundObjects.push(inputItem);
    }
  }

  if (promises.length === 0) return foundObjects;

  const resolvedPromises = await Promise.allSettled(promises);

  const resolveObjects = resolvedPromises
    .filter((res) => res.status === "fulfilled" && res.value)
    .map((res) => res.value);

  return [...foundObjects, ...resolveObjects];
}

export default convertJobIDsToObjects;
