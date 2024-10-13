import getJobDocumentFromFirebase from "../Firebase/getJobDocument";

async function getMissingJobObjects(requestedJobIDs, jobArray) {
  try {
    if (!requestedJobIDs || !jobArray) {
      throw new Error("Missing requested input or job array");
    }

    const jobIDs = [];

    if (Array.isArray(requestedJobIDs) || requestedJobIDs instanceof Set) {
      (Array.isArray(requestedJobIDs)
        ? requestedJobIDs
        : Array.from(requestedJobIDs)
      ).forEach((item) => {
        if (typeof item === "string" || typeof item === "number") {
          jobIDs.push(item);
        } else if (
          typeof item === "object" &&
          item !== null &&
          "jobID" in item
        ) {
          jobIDs.push(item.jobID);
        } else {
          throw new Error(
            "Array or Set item must be a string, number, or an object with an 'jobID' property."
          );
        }
      });
    } else if (
      typeof requestedJobIDs === "string" ||
      typeof requestedJobIDs === "number"
    ) {
      jobIDs.push(requestedJobIDs);
    } else {
      throw new Error(
        "Invalid type for requestedJobIDs. Must be an array, Set, or a single ID."
      );
    }

    const missingIDS = jobArray
      .map((job) => job.jobID)
      .filter((id) => !jobIDs.includes(id));

    const requests = missingIDS.map((id) => getJobDocumentFromFirebase(id));

    const results = await Promise.all(requests);

    return results.filter((result) => result !== null);
  } catch (err) {
    console.error("Error finding job objects:", err);
    return [];
  }
}

export default getMissingJobObjects;
