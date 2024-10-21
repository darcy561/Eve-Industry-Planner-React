function materialTreeShaker(allJobObjects, recalculateJob) {
  if (!allJobObjects || !recalculateJob) {
    console.log("Missing inputs ");
    return;
  }

  let changesMade;
  const maxIterations = 100;
  let iterationCounter = 0;

  do {
    changesMade = false;
    const iterationData = [];

    allJobObjects.forEach((job) => {
      let parentJobRequirements = 0;
      let itemRecalculated = false;
      job.parentJob.forEach((parentJobID) => {
        const parentJob = allJobObjects.find(
          ({ jobID }) => jobID === parentJobID
        );
        if ({ ...parentJob }) {
          const material = parentJob.build.materials.find(
            ({ typeID }) => typeID === job.itemID
          );
          if (material) {
            parentJobRequirements += material.quantity || 0;
          }
        }
      });

      const currentJobProduction = job.build.products.totalQuantity;
      const requirementDistance = job.itemsProducedPerRun;

      const minRequired = currentJobProduction - requirementDistance;
      const maxRequired = currentJobProduction + requirementDistance;

      if (
        parentJobRequirements < minRequired ||
        parentJobRequirements > maxRequired
      ) {
        recalculateJob(job, parentJobRequirements);
        itemRecalculated = true;
        changesMade = true;
      }
      iterationData.push({
        jobName: job.name,
        parentJobRequirements,
        currentJobProduction,
        minRequired,
        maxRequired,
        itemRecalculated,
      });
    });
    iterationCounter++;
    if (iterationCounter > maxIterations) {
      break;
    }

    console.log("Iteration: ", iterationCounter);
    console.table(iterationData);
  } while (changesMade);
}

export default materialTreeShaker;
