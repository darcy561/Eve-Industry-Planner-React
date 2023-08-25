import { useContext } from "react";
import { ActiveJobContext } from "../../Context/JobContext";
import { useBlueprintCalc } from "../useBlueprintCalc";
import { useInstallCostsCalc } from "./useInstallCostCalc";

export function useUpdateJobSetups() {
  const { activeJob } = useContext(ActiveJobContext);
  const { CalculateResources_New, CalculateTime_New } = useBlueprintCalc();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  function recalculateSetup(updatedSetup) {
    let jobSetups = { ...activeJob.build.setup };
    const itemsProducedPerRun = activeJob.itemsProducedPerRun;
    let newMaterialArray = [...activeJob.build.materials];

    updatedSetup.materialCount = CalculateResources_New(updatedSetup);
    updatedSetup.estimatedTime = CalculateTime_New(updatedSetup);
    updatedSetup.estimatedInstallCost =
      calculateInstallCostFromJob(updatedSetup);

    jobSetups[updatedSetup.id] = updatedSetup;

    const newTotalProduced = Object.values(jobSetups).reduce(
      (prev, { runCount, jobCount }) => {
        return (prev += itemsProducedPerRun * runCount * jobCount);
      },
      0
    );

    const newTotalQuantities = calculateTotalQuantities(jobSetups);

    for (const material of newMaterialArray) {
      const materialId = material.typeID.toString();
      if (materialId in newTotalQuantities) {
        material.quantity = newTotalQuantities[materialId];
      }
    }

    function calculateTotalQuantities(objectsList) {
      const totals = {};

      for (const objId of Object.keys(objectsList)) {
        const materialCount = objectsList[objId].materialCount || {};

        for (const materialId of Object.keys(materialCount)) {
          const quantity = materialCount[materialId].quantity || 0;
          totals[materialId] = (totals[materialId] || 0) + quantity;
        }
      }

      return totals;
    }

    return { jobSetups, newMaterialArray, newTotalProduced };
  }

  return {
    recalculateSetup,
  };
}
