import { useContext } from "react";
import {
  EvePricesContext,
  SystemIndexContext,
} from "../../Context/EveDataContext";
import { jobTypes } from "../../Context/defaultValues";
import { UsersContext } from "../../Context/AuthContext";
import { structureOptions } from "../../Context/defaultValues";
import { useMissingSystemIndex } from "./useImportMissingSystemIndexData";

export function useInstallCostsCalc() {
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const { evePrices } = useContext(EvePricesContext);
  const { users } = useContext(UsersContext);
  const { findMissingSystemIndex } = useMissingSystemIndex();

  const jobTypeMapping = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };

  const structureTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manStructure,
    [jobTypes.reaction]: structureOptions.reactionStructure,
  };

  const DEFAULT_STATION_TAX =
    structureTypeMap[jobTypes.manufacturing].defaultTax;
  const SCC_SURCHARGE = 1.5;
  const ALPHA_CLONE_TAX = 0.25;

  async function calculateInstallCostFromJob(selectedJob) {
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
      selectedJob.jobType,
      selectedJob.taxValue
    );

    const systemIndexValue = await findSystemIndex(
      selectedJob.systemID,
      selectedJob.jobType
    );

    const cloneValue = findCloneValue(selectedJob.selectedCharacter);

    const taxModifierTotal =
      estimatedItemValue *
      (systemIndexValue * facilityModifier +
        facilityTax +
        SCC_SURCHARGE / 100 +
        cloneValue);

    const systemIndexDeduction = Math.ceil(
      systemIndexValue * estimatedItemValue
    );

    const facilityBonusDeduction = Math.ceil(
      facilityModifier * systemIndexDeduction
    );

    const jobGrossCost = systemIndexDeduction - facilityBonusDeduction;

    const installCost = jobGrossCost + taxModifierTotal;

    async function findSystemIndex(requiredSystemID, jobType) {
      const updatedSystemIndexData = await findMissingSystemIndex(
        requiredSystemID
      );
      updateSystemIndexData(updatedSystemIndexData);
      return (
        updatedSystemIndexData[requiredSystemID]?.[jobTypeMapping[jobType]] || 0
      );
    }

    return installCost;
  }

  function estimatedItemPriceCalc(materialArray, jobCount) {
    return Math.ceil(
      Object.values(materialArray).reduce((preValue, material) => {
        return (preValue += estimatedMaterialPriceCalc(
          material.quantity / jobCount,
          material.typeID
        ));
      }, 0)
    );
  }

  function estimatedMaterialPriceCalc(materialQuantity, materialTypeID) {
    const adjustedPrice =
      evePrices.find((i) => i.typeID === materialTypeID)?.adjustedPrice || 0;

    return materialQuantity * adjustedPrice;
  }

  function findFacilityTax(facilityID, structureType, jobType, taxValue) {
    if (
      jobType === jobTypes.manufacturing &&
      structureType === structureTypeMap[jobTypes.manufacturing].id
    ) {
      return DEFAULT_STATION_TAX / 100;
    }

    if (!facilityID) return taxValue / 100;

    const parentUser = users.find((i) => i.ParentUser);
    if (!parentUser) return 0;

    const structureSelection =
      parentUser.settings.structures[jobTypeMapping[jobType]] || [];

    return structureSelection.find((i) => i.id === facilityID)?.tax / 100 || 0;
  }

  function findCloneValue(inputCharacterHash) {
    const matchedCharacter = users.find(
      (i) => i.CharacterHash === inputCharacterHash
    );

    return matchedCharacter?.isOmega ? 0 : ALPHA_CLONE_TAX / 100;
  }

  function findFacilityModifier(inputFacilityID, jobType) {
    return structureTypeMap[jobType][inputFacilityID]?.cost || 0;
  }

  return { calculateInstallCostFromJob };
}
