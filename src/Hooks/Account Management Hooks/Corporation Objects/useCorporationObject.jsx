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
    if (!corporationObject) return
    
    if (corporationObject.owners.length > 1) {
      corporationObject.owners = corporationObject.owners.filter((i) => i !== characterObject.CharacterHash); 
    } else {
      copiedMap.delete(characterObject.corporation_id)
      sessionStorage.removeItem(`corpAssets_${characterObject.corporation_id}`);
    }
    updateCorpEsiData(copiedMap)
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

  if (!esiCorpPublicInfo || !esiCorpDivisions || !esiCorpAssets) return;

  saveCorporationAssets(esiCorpPublicInfo, esiCorpAssets);

  const updatedHangarData = esiCorpDivisions?.hangar
    .map((hangarItem) => ({
      ...hangarItem,
      assetLocationRef: `CorpSAG${hangarItem.division}`,
    }))
    .concat([staticHangars]);

  const officeLocations = esiCorpAssets.reduce((prev, asset) => {
    if (asset.location_flag === "OfficeFolder") {
      prev.add(asset.location_id);
    }
    return prev;
  }, new Set());

  return {
    alliance_id: esiCorpPublicInfo.alliance_id,
    name: esiCorpPublicInfo.name,
    tax_rate: esiCorpPublicInfo.tax_rate,
    ticker: esiCorpPublicInfo.ticker,
    corporation_id: esiCorpPublicInfo.corporation_id,
    hangars: updatedHangarData || null,
    wallets: esiCorpDivisions?.wallet || null,
    officeLocations: [...officeLocations],
    owners: [owner],
  };
}

function updateExistingCorporation(existingCorpObject, esiObject) {
  const { esiCorpPublicInfo, esiCorpDivisions, esiCorpAssets, owner } =
    esiObject;

  saveCorporationAssets(esiCorpPublicInfo, esiCorpAssets);

  const officeLocations = esiCorpAssets.reduce((prev, asset) => {
    if (asset.location_flag === "OfficeFolder") {
      prev.add(asset.location_id);
    }
    return prev;
  }, new Set());

  if (esiCorpDivisions && (!existingCorpObject.hangar || !existingCorpObject.wallet)) {
    existingCorpObject.hangars = esiCorpDivisions.hangar;
    existingCorpObject.wallets = esiCorpDivisions.wallet;
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
    sessionStorage.setItem(`corpAssets_${esiPublicInfo.corporation_id}`, null);
  }
}
