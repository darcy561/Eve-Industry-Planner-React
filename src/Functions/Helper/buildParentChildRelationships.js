function buildParentChildRelationships(inputJobArray) {
  const typesMap = {};
  const jobIDMap = {};

  inputJobArray.forEach((job) => {
    if (!typesMap[job.itemID]) {
      typesMap[job.itemID] = new Set();
    }
    typesMap[job.itemID].add(job.jobID);
    jobIDMap[job.jobID] = job;
  });

  inputJobArray.forEach((job) => {
    if (job.build && job.build.materials) {
      job.build.materials.forEach((material) => {
        const relatedJobs = typesMap[material.typeID];
        if (relatedJobs) {
          job.addChildJob(material.typeID, relatedJobs);

          relatedJobs.forEach((id) => {
            const matchingJob = jobIDMap[id];
            matchingJob.addParentJob(job.jobID);
          });
        }
      });
    }
  });
}

export default buildParentChildRelationships
