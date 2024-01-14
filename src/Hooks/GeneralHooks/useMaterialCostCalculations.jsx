import { useContext, useMemo } from "react";
import { JobArrayContext } from "../../Context/JobContext";
import { EvePricesContext } from "../../Context/EveDataContext";

export function useMaterialCostCalculations() {
  const { jobArray } = useContext(JobArrayContext);
  const { evePrices } = useContext(EvePricesContext);

  function calculateMaterialCostFromChildJobs(
    inputMaterial,
    childJobs,
    alternativeJobLocation = [],
    alternativePriceLocation,
    defaultMarketLocation,
    defaultOrderType
  ) {
    if (!Array.isArray(alternativeJobLocation)) {
      alternativeJobLocation = [alternativeJobLocation];
    }

    const availableJobSelection = [...jobArray, ...alternativeJobLocation];
    const availablePriceSelection = [...evePrices, ...alternativePriceLocation];

    const materialPrice = getMaterialPrice(inputMaterial);

    if (inputMaterial.purchaseComplete) {
      return inputMaterial.purchasedCost;
    }
    if (childJobs.length > 0) {
      let jobCost = 0;
      for (let childJobID of childJobs) {
        const matchedJob = availableJobSelection.find(
          (i) => i.jobID === childJobID
        );
        if (!matchedJob) continue;

        jobCost += jobCostCalculation(matchedJob) * inputMaterial.quantity;
      }

      return jobCost;
    }

    return materialPrice * inputMaterial.quantity;

    function jobCostCalculation(inputJob) {
      let jobCost = inputJob.build.costs.extrasTotal;

      if (!inputJob.build.costs.installCosts) {
        jobCost += Object.values(inputJob.build.setup).reduce(
          (prev, { estimatedInstallCost }) => {
            return (prev += estimatedInstallCost);
          },
          0
        );
      } else {
        jobCost += inputJob.build.costs.installCosts;
      }
      for (let material of inputJob.build.materials) {
        const childJobLocation = inputJob.build.childJobs[material.typeID];
        const materialPrice = getMaterialPrice(material);
        if (material.purchaseComplete) {
          jobCost += material.purchasedCost;
        } else if (childJobLocation.length > 0) {
          for (let childJobID of childJobLocation) {
            const matchedJob = availableJobSelection.find(
              (i) => i.jobID === childJobID
            );
            if (!matchedJob) continue;

            jobCost += jobCostCalculation(matchedJob) * material.quantity;
          }
        } else {
          jobCost += materialPrice * material.quantity;
        }
      }
      return jobCost / inputJob.build.products.totalQuantity;
    }

    function getMaterialPrice(materialObject) {
      return (
        availablePriceSelection.find(
          (i) => i.typeID === materialObject.typeID
        )?.[defaultMarketLocation]?.[defaultOrderType] ||
        materialObject.purchasedCost
      );
    }
  }

  return {
    calculateMaterialCostFromChildJobs,
  };
}
