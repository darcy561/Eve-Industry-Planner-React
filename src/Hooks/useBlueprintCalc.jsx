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

export function CalculateTotals(item) {
  switch (item.jobType) {
    case 1:
      const newManArray = item.job.materials;
      for (let job = 0; job < newManArray.length; job++) {
        let x = manufacturingMaterialCalc(
          item.manufacturing.materials[job].quantity,
          item.runCount,
          item.jobCount,
          item.bpME,
          item.structureType,
          item.rigType,
          item.systemType
        );
        newManArray[job].quantity = x;
      };

      item.job.products.totalQuantity =
        item.manufacturing.products[0].quantity * item.runCount * item.jobCount;
      item.job.products.quantityPerJob =
        item.manufacturing.products[0].quantity * item.runCount;
      return newManArray;

    case 2:
      const newReacArray = item.job.materials;
      for (let job = 0; job < newReacArray.length; job++) {
        let x = reactionMaterialCalc(
          item.reaction.materials[job].quantity,
          item.runCount,
          item.jobCount,
          item.rigType,
          item.systemType
        );
        newReacArray[job].quantity = x;
      }
      item.job.products.totalQuantity =
        item.reaction.products[0].quantity * item.runCount * item.jobCount;
      item.job.products.quantityPerJob =
        item.reaction.products[0].quantity * item.runCount;
      return newReacArray;
  };
};

// export const calcProductionTime = useCallback((job) => {

//   const skillsModifier = () => {
    
//   }

//   const outputTime = baseProdTime*timeModifier*skillsModifier*runs
// })
