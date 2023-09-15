import { startTransition, useContext, useMemo } from "react";
import { useSetupManagement } from "../GeneralHooks/useSetupManagement";
import { SystemIndexContext } from "../../Context/EveDataContext";
import { jobTypes, structureOptions } from "../../Context/defaultValues";
import { UsersContext } from "../../Context/AuthContext";
import { useMissingSystemIndex } from "../GeneralHooks/useImportMissingSystemIndexData";

export function useUpdateSetupValue() {
  const { users } = useContext(UsersContext);
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { recalculateSetup } = useSetupManagement();
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
    activeJob,
    updateActiveJob,
    requiresSystemData
  ) {
    setupObject[setupAttribute] = setupAttributeValue;

    if (
      activeJob.jobType === jobTypes.manufacturing &&
      setupObject.structureID === structureTypeMap[activeJob.jobType][0].id
    ) {
      setupObject.rigID = rigTypeMap[activeJob.jobType][0].id;
      setupObject.taxValue = structureTypeMap[activeJob.jobType][0].defaultTax;
    }

    if (setupAttribute === "customStructureID") {
      if (!setupAttributeValue) {
        setupObject.customStructureID = null;
      } else {
        const selectedStructure = parentUser.settings.structures[
          customStructureMap[activeJob.jobType]
        ].find((i) => i.id === setupAttributeValue);

        setupObject.structureID = selectedStructure.structureType;
        setupObject.rigID = selectedStructure.rigType;
        setupObject.systemTypeID = selectedStructure.systemType;
        setupObject.systemID = selectedStructure.systemID;
        setupObject.taxValue = selectedStructure.tax;
      }
    }

    const { jobSetups, newMaterialArray, newTotalProduced } =
      await recalculateSetup(setupObject, activeJob);

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
  }

  return {
    recalcuateJobFromSetup,
  };
}
