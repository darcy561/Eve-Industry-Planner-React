
export function manufacturingMaterialCalc(
  baseQty,
  itemRuns,
  itemJobs,
  bpME,
  structureType,
  rigType,
  systemType
) {
  const meModifier = (1 - bpME / 100) * (1 - structureType / 100) * (1 - (rigType / 100) * systemType);
  console.log(meModifier);
  const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
  console.log(x);
  return x;
}

export function reactionMaterialCalc(
  baseQty,
  itemRuns,
  itemJobs,
  rigType,
  systemMultiplyer
) {
  const meModifier = 1 - (rigType / 100) * systemMultiplyer;
  //console.log(meModifier);
    const x = Math.max(Math.ceil(itemRuns * baseQty * meModifier) * itemJobs);
//   console.log(x);
  return x;
}

export function CalculateTotals(item) {
    switch (item.jobType) {
        case 1:
            for (let job = 0; job < item.manufacturing.materials.length; job++) {
                let x = manufacturingMaterialCalc(item.manufacturing.materials[job].quantity, item.runCount, item.jobCount, item.bpME, item.structureType, item.rigType, item.systemType);
                // console.log(item.manufacturing.materials[job].quantity);
                item.job.materials[job].quantity = x;
            };
            item.job.products.totalQuantity = (item.manufacturing.products[0].quantity * item.runCount) * item.jobCount;
            item.job.products.quantityPerJob = item.manufacturing.products[0].quantity * item.runCount;
            break;

        case 2:
            for (let job = 0; job < item.reaction.materials.length; job++) {
                let x = reactionMaterialCalc(item.reaction.materials[job].quantity, item.runCount, item.jobCount, item.rigType, item.systemMultiplyer);
                item.job.materials[job].quantity = x;
            };
            item.job.products.totalQuantity = (item.reaction.products[0].quantity * item.runCount) * item.jobCount;
            item.job.products.quantityPerJob = (item.reaction.products[0].quantity * item.runCount);
            break;
    };
};