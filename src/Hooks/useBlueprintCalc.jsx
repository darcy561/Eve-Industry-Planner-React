function manufacturingMaterialCalc(
  baseQty,
  itemRuns,
  itemJobs,
  bpME,
  structureType,
  rigType,
  systemType
) {
  let meModifier =
    (1 - bpME / 100) *
    (1 - structureType / 100) *
    (1 - (rigType / 100) * systemType);
  if (baseQty === 1) {
    meModifier = 1;
  }
  const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
  // console.log(itemRuns)
  // console.log(baseQty)
  // console.log(meModifier);
  // console.log(itemJobs)
  // console.log(x);
  return x;
}

function reactionMaterialCalc(
  baseQty,
  itemRuns,
  itemJobs,
  rigType,
  systemMultiplyer
) {
  let meModifier = 1 - (rigType / 100) * systemMultiplyer;
  if (baseQty === 1) {
    meModifier = 1;
  }
  //console.log(meModifier);
  const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
  //console.log(x);
  return x;
}

export function useBlueprintCalc() {
  const CalculateResources = (job) => {
    switch (job.jobType) {
      case 1:
        const newManArray = [...job.build.materials];
        for (let material of newManArray) {
          const rawIndex = job.rawData.materials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = manufacturingMaterialCalc(
            job.rawData.materials[rawIndex].quantity,
            job.runCount,
            job.jobCount,
            job.bpME,
            job.structureType,
            job.rigType,
            job.systemType
          );
        }

        job.build.products.totalQuantity =
          job.rawData.products[0].quantity * job.runCount * job.jobCount;
        job.build.products.quantityPerJob =
          job.rawData.products[0].quantity * job.runCount;

        job.build.materials = newManArray;
        return job;

      case 2:
        const newReacArray = [...job.build.materials];
        for (let material of newReacArray) {
          const rawIndex = job.rawData.materials.findIndex(
            (i) => i.typeID === material.typeID
          );
          material.quantity = reactionMaterialCalc(
            job.rawData.materials[rawIndex].quantity,
            job.runCount,
            job.jobCount,
            job.rigType,
            job.systemType
          );
        }
        job.build.products.totalQuantity =
          job.rawData.products[0].quantity * job.runCount * job.jobCount;
        job.build.products.quantityPerJob =
          job.rawData.products[0].quantity * job.runCount;

        job.build.materials = newReacArray;
        return job;
    }
  };
  return { CalculateResources };
}
