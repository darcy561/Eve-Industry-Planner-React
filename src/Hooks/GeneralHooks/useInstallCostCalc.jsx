import { useContext } from "react";
import {
  EvePricesContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import { jobTypes } from "../../Context/defaultValues";
import { UsersContext } from "../../Context/AuthContext";
import { structureOptions } from "../../Context/defaultValues";

export function useInstallCostsCalc() {
  const { systemIndexData } = useContext(SystemIndexContext);
  const { evePrices } = useContext(EvePricesContext);
  const { users } = useContext(UsersContext);

  const DEFAULT_STATION_TAX = 0.25;
  const SCC_SURCHARGE = 0.75;
  const ALPHA_CLONE_TAX = 0.25;

  const jobTypeMapping = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };

  const calculateInstallCostFromJob = (selectedJob) => {
    const estimatedItemValue = estimatedItemPriceCalc(
      selectedJob.materialCount,
      selectedJob.jobCount
    );

    const facilityModifier = findFacilityModifier(
      selectedJob.structureID,
      selectedJob.jobType
    );

    const facilityTax = findFacilityTax(
      selectedJob.customStructureID,
      selectedJob.structureID,
      selectedJob.jobType
    );

    const systemIndexValue = findSystemIndex(
      selectedJob.systemID,
      selectedJob.jobType
    );

    const cloneValue = findCloneValue(selectedJob.selectedCharacter);

    const installCost =
      estimatedItemValue *
      (systemIndexValue * facilityModifier +
        facilityTax +
        SCC_SURCHARGE / 100 +
        cloneValue);

    return installCost;
  };

  function estimatedItemPriceCalc(materialArray, jobCount) {
    return Object.values(materialArray).reduce((preValue, material) => {
      return (preValue += estimatedMaterialPriceCalc(
        material.quantity / jobCount,
        material.typeID
      ));
    }, 0);
  }

  function estimatedMaterialPriceCalc(materialQuantity, materialTypeID) {
    const adjustedPrice =
      evePrices.find((i) => i.typeID === materialTypeID)?.adjustedPrice || 0;

    return materialQuantity * adjustedPrice;
  }

  function findFacilityTax(facilityID, structureType, jobType) {
    if (
      jobType === jobTypes.manufacturing &&
      structureType === structureOptions.manStructure[0].id
    ) {
      return DEFAULT_STATION_TAX / 100;
    }

    const parentUser = users.find((i) => i.ParentUser);
    if (!parentUser) return 0;

    const structureSelection =
      parentUser.settings.structures[jobTypeMapping[jobType]] || [];

    return structureSelection.find((i) => i.id === facilityID)?.tax / 100 || 0;
  }

  function findSystemIndex(requiredSystemID, jobType) {
    return systemIndexData[requiredSystemID]?.[jobTypeMapping[jobType]] || 0;
  }

  function findCloneValue(inputCharacterHash) {
    const matchedCharacter = users.find(
      (i) => i.CharacterHash === inputCharacterHash
    );

    return matchedCharacter?.isOmega ? 0 : ALPHA_CLONE_TAX / 100;
  }

  function findFacilityModifier(inputFacilityID, jobType) {
    if (jobType === jobTypes.manufacturing) {
      return structureOptions.manStructure[inputFacilityID].cost;
    }
    if (jobType === jobTypes.reaction) {
      return structureOptions.reactionStructure[inputFacilityID].cost;
    }
    return 0;
  }

  return { calculateInstallCostFromJob };
}
