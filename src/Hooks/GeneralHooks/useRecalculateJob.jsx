import { useJobBuild } from "../useJobBuild";
import uuid from "react-uuid";
import { useInstallCostsCalc } from "./useInstallCostCalc";
import { useBlueprintCalc } from "../useBlueprintCalc";

export function useRecalcuateJob() {
  const {
    calculateJobMaterialQuantities,
    recalculateItemQty_New,
    } = useJobBuild();
    const {CalculateTime_New, CalculateResources_New} = useBlueprintCalc()
  const { calculateInstallCostFromJob } = useInstallCostsCalc();

  async function recalculateJobForNewTotal(inputJob, requiredQuantity) {
    if (!inputJob || !requiredQuantity) return;

    let setupLocation = inputJob.build.setup;

    const newSetupQuantities = recalculateItemQty_New(
      inputJob.maxProductionLimit,
      inputJob.rawData.products[0].quantity,
      requiredQuantity
    );

    if (newSetupQuantities.length === Object.values(setupLocation).length) {
      for (let i = 0; i < Object.values(setupLocation).length; i++) {
        const newQuantities = newSetupQuantities[i];
        const chosenSetup = Object.values(setupLocation)[i];

        chosenSetup.jobCount = newQuantities.jobCount;
        chosenSetup.runCount = newQuantities.runCount;
      }
    }
    if (newSetupQuantities.length !== Object.values(setupLocation).length) {
      let newSetupLocation = {};
      for (const { runCount, jobCount } of newSetupQuantities) {
        const replacementID = uuid();
        newSetupLocation[replacementID] = {
          ...Object.values(setupLocation)[0],
        };

        newSetupLocation[replacementID].id = replacementID;
        newSetupLocation[replacementID].runCount = runCount;
        newSetupLocation[replacementID].jobCount = jobCount;
      }
      inputJob.build.setup = newSetupLocation;
      setupLocation = newSetupLocation;
    }

    for (let setup of Object.values(setupLocation)) {
      setup.estimatedTime = CalculateTime_New(setup, inputJob.skills);
      setup.materialCount = CalculateResources_New(setup);
      setup.estimatedInstallCost = await calculateInstallCostFromJob(setup);
    }
    const newTotalQuantities = calculateJobMaterialQuantities(setupLocation);

    for (const material of inputJob.build.materials) {
      const materialID = material.typeID.toString();
      if (materialID in newTotalQuantities) {
        material.quantity = newTotalQuantities[materialID];
      }
    }

    inputJob.build.products.totalQuantity = Object.values(
      inputJob.build.setup
    ).reduce((prev, { runCount, jobCount }) => {
      return prev + inputJob.itemsProducedPerRun * runCount * jobCount;
    }, 0);
  }

  return {
    recalculateJobForNewTotal,
  };
}
