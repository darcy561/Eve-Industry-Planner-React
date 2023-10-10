import { useContext, useMemo } from "react";
import { useBlueprintCalc } from "../useBlueprintCalc";
import { useInstallCostsCalc } from "./useInstallCostCalc";
import { useJobBuild } from "../useJobBuild";
import { UsersContext } from "../../Context/AuthContext";

export function useSetupManagement() {
  const { users } = useContext(UsersContext);
  const { CalculateResources_New, CalculateTime_New } = useBlueprintCalc();
  const { calculateInstallCostFromJob } = useInstallCostsCalc();
  const {
    buildNewSetupObject,
    addItemBlueprint_New,
    addDefaultStructure_New,
    recalculateItemQty_New,
    calculateJobMaterialQuantities,
  } = useJobBuild();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  async function recalculateSetup(chosenSetup, chosenJob) {
    let jobSetups = { ...chosenJob.build.setup };
    const itemsProducedPerRun = chosenJob.itemsProducedPerRun;
    let newMaterialArray = [...chosenJob.build.materials];

    chosenSetup.materialCount = CalculateResources_New(chosenSetup);
    chosenSetup.estimatedTime = CalculateTime_New(chosenSetup);
    chosenSetup.estimatedInstallCost = await calculateInstallCostFromJob(
      chosenSetup
    );

    jobSetups[chosenSetup.id] = chosenSetup;

    const newTotalProduced = Object.values(jobSetups).reduce(
      (prev, { runCount, jobCount }) => {
        return (prev += itemsProducedPerRun * runCount * jobCount);
      },
      0
    );

    const newTotalQuantities = calculateJobMaterialQuantities(jobSetups);

    for (const material of newMaterialArray) {
      const materialId = material.typeID.toString();
      if (materialId in newTotalQuantities) {
        material.quantity = newTotalQuantities[materialId];
      }
    }

    return { jobSetups, newMaterialArray, newTotalProduced };
  }

  async function addNewSetup(selectedJob) {
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

    const newSetup = buildNewSetupObject({
      ME,
      TE,
      ...structureData,
      ...setupQuantities[0],
      characterToUse: parentUser.CharacterHash,
      rawTimeValue,
      jobType: selectedJob.jobType,
    });

    existingMaterialsLocation.forEach((material) => {
      newSetup.materialCount[material.typeID] = {
        typeID: material.typeID,
        quantity: material.quantity,
        rawQuantity: material.quantity,
      };
    });

    newSetup.estimatedTime = CalculateTime_New(newSetup, selectedJob.skills);
    newSetup.materialCount = CalculateResources_New(newSetup);
    newSetup.estimatedInstallCost = await calculateInstallCostFromJob(newSetup);

    const { jobSetups, newMaterialArray, newTotalProduced } =
      await recalculateSetup(newSetup, selectedJob);

    return { jobSetups, newMaterialArray, newTotalProduced };
  }

  return {
    addNewSetup,
    recalculateSetup,
  };
}
