import { useContext } from "react";
import { CorpEsiDataContext } from "../../../Context/EveDataContext";

export function useCorporationObject() {
  const { corpEsiData, updateCorpEsiData } = useContext(CorpEsiDataContext);

  function updateCorporationObject(esiObjectArray) {
    const copiedMap = new Map(corpEsiData);

    for (const esiObject of esiObjectArray) {
      const corpPublicInfo = esiObject.esiCorpPublicInfo;

      if (!corpPublicInfo) continue;
      if (copiedMap.has(corpPublicInfo.corporation_id)) {
        updateExistingCorporation(
          copiedMap.get(corpPublicInfo.corporation_id),
          esiObject
        );
      } else {
        copiedMap.set(
          corpPublicInfo.corporation_id,

          addNewCorporation(esiObject)  
        );
      }
    }
    updateCorpEsiData(copiedMap);
  }

  function removeCorporationObject(characterObject) {
    const copiedMap = new Map(corpEsiData);

    const corporationObject = copiedMap.get(characterObject.corporation_id);
    if (!corporationObject) return;

    if (corporationObject.owners.length > 1) {
      corporationObject.owners = corporationObject.owners.filter(
        (i) => i !== characterObject.CharacterHash
      );
    } else {
      copiedMap.delete(characterObject.corporation_id);
      sessionStorage.removeItem(`corpAssets_${characterObject.corporation_id}`);
    }
    updateCorpEsiData(copiedMap);
  }

  return { updateCorporationObject, removeCorporationObject };
}

function addNewCorporation(esiObject) {
  const { esiCorpPublicInfo, esiCorpDivisions, esiCorpAssets, owner } =
    esiObject;
  const staticHangars = {
    division: 0,
    name: "Projects",
    assetLocationRef: "CorporationGoalDeliveries",
  };

  if (!esiCorpPublicInfo || !esiCorpAssets) return;

  saveCorporationAssets(esiCorpPublicInfo, esiCorpAssets);

  const updatedHangarData = (esiCorpDivisions.hangar || [])
  .map((hangarItem) => ({
      ...hangarItem,
      assetLocationRef: `CorpSAG${hangarItem.division}`,
    }))
    .concat([staticHangars]);

  const officeLocations = [
    ...new Set(
      esiCorpAssets
        .filter((asset) => asset.location_flag === "OfficeFolder")
        .map((asset) => asset.location_id)
    ),
  ];
  console.log(officeLocations);
  return {
    alliance_id: esiCorpPublicInfo.alliance_id || null,
    name: esiCorpPublicInfo.name,
    tax_rate: esiCorpPublicInfo.tax_rate,
    ticker: esiCorpPublicInfo.ticker,
    corporation_id: esiCorpPublicInfo.corporation_id,
    hangars: updatedHangarData || null,
    wallets: esiCorpDivisions?.wallet || null,

    officeLocations: [...officeLocations] || [],
    owners: [owner],
  };
}

function updateExistingCorporation(existingCorpObject, esiObject) {
  const { esiCorpPublicInfo, esiCorpDivisions, esiCorpAssets, owner } =
    esiObject;
  saveCorporationAssets(esiCorpPublicInfo, esiCorpAssets);

  const officeLocations = new Set(
    esiCorpAssets
      .filter((asset) => asset.location_flag === "OfficeFolder")
      .map((asset) => asset.location_id)
  );

  if (esiCorpDivisions) {
    if (!existingCorpObject.hangars) {
      existingCorpObject.hangars = esiCorpDivisions.hangar || [];
    }
    if (!existingCorpObject.wallets) {
      existingCorpObject.wallets = esiCorpDivisions.wallet || [];
    }
  }

  if (!Array.isArray(existingCorpObject.officeLocations)) {
    existingCorpObject.officeLocations = [];
  }
  
  existingCorpObject.officeLocations = [
    ...new Set([...officeLocations, ...existingCorpObject.officeLocations]),
  ];
  existingCorpObject.owners.push(owner);
}

function saveCorporationAssets(esiPublicInfo, esiAssets) {  
  try {
    if (esiAssets.length === 0) return;

    sessionStorage.setItem(
      `corpAssets_${esiPublicInfo.corporation_id}`,
      JSON.stringify(esiAssets)
    );
  } catch (err) {
    console.warn('Corporation Assets data is too large to store in sessionStorage.');
    sessionStorage.setItem(`corpAssets_${esiPublicInfo.corporation_id}`, null);
  }
}
