import { useContext, useMemo } from "react";
import { ActiveJobContext } from "../../Context/JobContext";
import { useBlueprintCalc } from "../useBlueprintCalc";
import { useInstallCostsCalc } from "./useInstallCostCalc";
import { useJobBuild } from "../useJobBuild";
import { UsersContext } from "../../Context/AuthContext";

export function useSetupManagement() {
  const { users } = useContext(UsersContext);
  const { activeJob } = useContext(ActiveJobContext);
  const { CalculateResources_New, CalculateTime_New } = useBlueprintCalc();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();
  const {
    buildNewSetupObject,
    addItemBlueprint_New,
    addDefaultStructure_New,
    recalculateItemQty_New,
  } = useJobBuild();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  function recalculateSetup(chosenSetup, chosenJob) {
    let jobSetups = { ...chosenJob.build.setup };
    const itemsProducedPerRun = chosenJob.itemsProducedPerRun;
    let newMaterialArray = [...chosenJob.build.materials];

    chosenSetup.materialCount = CalculateResources_New(chosenSetup);
    chosenSetup.estimatedTime = CalculateTime_New(chosenSetup);
    chosenSetup.estimatedInstallCost = calculateInstallCostFromJob(chosenSetup);

    jobSetups[chosenSetup.id] = chosenSetup;

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

  function addNewSetup(selectedJob) {
    const existingMaterialsLocation = selectedJob.rawData.materials;
    const rawTimeValue = selectedJob.rawData.time;

    const requiredQuantity = selectedJob.rawData.products[0].quantity;

    const { ME, TE } = addItemBlueprint_New(
      selectedJob.jobType,
      selectedJob.blueprintTypeID
    );
    const structureData = addDefaultStructure_New(selectedJob.jobType);

    const setupQuantities = recalculateItemQty_New(
      selectedJob.maxProductionLimit,
      selectedJob.rawData.products[0].quantity,
      requiredQuantity
    );
    let returnObject = {};

    for (let i = 0; i < setupQuantities.length; i++) {
      let nextObject = buildNewSetupObject({
        ME,
        TE,
        ...structureData,
        ...setupQuantities[i],
        characterToUse: parentUser.CharacterHash,
        rawTimeValue,
        jobType: selectedJob.jobType,
      });

      existingMaterialsLocation.forEach((material) => {
        nextObject.materialCount[material.typeID] = {
          typeID: material.typeID,
          quantity: material.quantity,
          rawQuantity: material.quantity,
        };
      });

      nextObject.estimatedTime = CalculateTime_New(
        nextObject,
        selectedJob.skills
      );
      nextObject.materialCount = CalculateResources_New(nextObject);
      nextObject.estimatedInstallCost = calculateInstallCostFromJob(nextObject);

      returnObject[nextObject.id] = nextObject;
    }
    return returnObject;
  }

  return {
    addNewSetup,
    recalculateSetup,
  };
}
