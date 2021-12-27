import { useCallback } from "react";

function manufacturingMaterialCalc(
  baseQty,
  itemRuns,
  itemJobs,
  bpME,
  structureType,
  rigType,
  systemType
) {
  const meModifier =
    (1 - bpME / 100) *
    (1 - structureType / 100) *
    (1 - (rigType / 100) * systemType);
  // console.log(meModifier);
  const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
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
  const meModifier = 1 - (rigType / 100) * systemMultiplyer;
  //console.log(meModifier);
  const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
  //console.log(x);
  return x;
}

export function useBlueprintCalc() {
  const CalculateResources = useCallback((job) => {
    
    switch (job.jobType) {
      case 1:
        const newManArray = job.build.materials;
        for (let material = 0; material < newManArray.length; material++) {

          newManArray[material].quantity = manufacturingMaterialCalc(
            job.rawData.materials[material].quantity,
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
        const newReacArray = job.build.materials;
        for (let material = 0; material < newReacArray.length; material++) {

          newReacArray[material].quantity = reactionMaterialCalc(
            job.rawData.materials[material].quantity,
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
  },[]);
  return {CalculateResources}
}
