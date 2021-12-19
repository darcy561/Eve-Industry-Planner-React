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
        const newManArray = job.job.materials;
        for (let material = 0; material < newManArray.length; material++) {
          let x = manufacturingMaterialCalc(
            job.manufacturing.materials[material].quantity,
            job.runCount,
            job.jobCount,
            job.bpME,
            job.structureType,
            job.rigType,
            job.systemType
          );
          newManArray[material].quantity = x;
        }

        job.job.products.totalQuantity =
          job.manufacturing.products[0].quantity * job.runCount * job.jobCount;
        job.job.products.quantityPerJob =
          job.manufacturing.products[0].quantity * job.runCount;

        job.job.materials = newManArray;
        return job;

      case 2:
        const newReacArray = job.job.materials;
        for (let material = 0; material < newReacArray.length; material++) {
          let x = reactionMaterialCalc(
            job.reaction.materials[material].quantity,
            job.runCount,
            job.jobCount,
            job.rigType,
            job.systemType
          );
          newReacArray[material].quantity = x;
        }
        job.job.products.totalQuantity =
          job.reaction.products[0].quantity * job.runCount * job.jobCount;
        job.job.products.quantityPerJob =
          job.reaction.products[0].quantity * job.runCount;

        job.job.materials = newReacArray;
        return job;
    }
  },[]);
  return {CalculateResources}
}
