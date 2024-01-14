import { useContext, useMemo } from "react";
import { useSetupManagement } from "../GeneralHooks/useSetupManagement";
import { jobTypes, structureOptions } from "../../Context/defaultValues";
import { UsersContext } from "../../Context/AuthContext";
import { SystemIndexContext } from "../../Context/EveDataContext";
import { useMissingSystemIndex } from "../GeneralHooks/useImportMissingSystemIndexData";
import { useRecalcuateJob } from "../GeneralHooks/useRecalculateJob";

export function useUpdateSetupValue() {
  const { users } = useContext(UsersContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { recalculateSetup } = useSetupManagement();
  const { recalculateJobForNewTotal } = useRecalcuateJob();
  const { findMissingSystemIndex } = useMissingSystemIndex();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const customStructureMap = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };
  const structureTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manStructure,
    [jobTypes.reaction]: structureOptions.reactionStructure,
  };
  const rigTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manRigs,
    [jobTypes.reaction]: structureOptions.reactionRigs,
  };

  async function recalcuateJobFromSetup(
    setupObject,
    setupAttribute,
    setupAttributeValue,
    requirements,
    activeJob,
    updateActiveJob,
    requiresSystemData
  ) {
    setupObject[setupAttribute] = setupAttributeValue;

    updateRequirementFields(setupObject, requirements);
    applyCustomStructure(setupObject, setupAttribute, setupAttributeValue);

    const updatedSystemIndexData = await findMissingSystemIndex(
      setupObject.systemID
    );

    const { jobSetups, newMaterialArray, newTotalProduced } = recalculateSetup(
      setupObject,
      activeJob,
      undefined,
      updatedSystemIndexData
    );

    updateActiveJob((prev) => ({
      ...prev,
      build: {
        ...prev.build,
        setup: jobSetups,
        materials: newMaterialArray,
        products: {
          ...prev.build.products,
          totalQuantity: newTotalProduced,
        },
      },
    }));
    updateSystemIndexData(updatedSystemIndexData);
  }

  function recalculateWatchListItems(
    requestedTypeID,
    mainTypeID,
    setupID,
    attribute,
    attributeValue,
    requirements,
    materialObject
  ) {
    let newMaterialObject = { ...materialObject };

    newMaterialObject[requestedTypeID].build.setup[setupID][attribute] =
      attributeValue;
    updateRequirementFields(
      newMaterialObject[requestedTypeID].build.setup[setupID],
      requirements
    );

    applyCustomStructure(
      newMaterialObject[requestedTypeID].build.setup[setupID],
      attribute,
      attributeValue
    );

    const { jobSetups, newMaterialArray, newTotalProduced } = recalculateSetup(
      newMaterialObject[requestedTypeID].build.setup[setupID],
      newMaterialObject[requestedTypeID]
    );

    newMaterialObject[requestedTypeID].build.setup = jobSetups;
    newMaterialObject[requestedTypeID].build.materials = newMaterialArray;
    newMaterialObject[requestedTypeID].build.products.totalQuantity =
      newTotalProduced;

    if (requestedTypeID === mainTypeID) {
      const mainJob = newMaterialObject[mainTypeID];

      for (let material of mainJob.build.materials) {
        if (
          material.jobType !== jobTypes.manufacturing ||
          material.jobType !== jobTypes.reaction
        )
          continue;
        
        const materialJob = newMaterialObject[material.typeID];
        recalculateJobForNewTotal(materialJob, material.quantity);
      }
    }

    return newMaterialObject;
  }

  function updateRequirementFields(setupObject, requirements) {
    if (!requirements || !setupObject) return;

    const attributesToCopy = [
      "structureID",
      "rigID",
      "systemTypeID",
      "systemID",
      "taxValue",
    ];

    for (const attribute of attributesToCopy) {
      if (attribute in requirements) {
        setupObject[attribute] = requirements[attribute];
      }
    }
  }

  function applyCustomStructure(setupObject, attribute, attributeValue) {
    if (attribute !== "customStructureID") return;
    if (!attributeValue) {
      setupObject.customStructureID = null;
    } else {
      const selectedStructure = parentUser.settings.structures[
        customStructureMap[setupObject.jobType]
      ].find((i) => i.id === attributeValue);

      setupObject.structureID = selectedStructure.structureType;
      setupObject.rigID = selectedStructure.rigType;
      setupObject.systemTypeID = selectedStructure.systemType;
      setupObject.systemID = selectedStructure.systemID;
      setupObject.taxValue = selectedStructure.tax;
    }
  }

  return {
    recalcuateJobFromSetup,
    recalculateWatchListItems,
  };
}
