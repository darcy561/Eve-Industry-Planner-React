import { useContext } from "react";
import { CorpEsiDataContext } from "../../../Context/EveDataContext";

export function useCorporationObject() {
    const { updateCorpEsiData } = useContext(CorpEsiDataContext);
    
  function updateCorporationObject(esiObjectArray, inputMap) {
    const copiedMap = new Map(inputMap);

    for (const esiObject of esiObjectArray) {
      const corpPublicInfo = esiObject.esoCorpPublicInfo;

      if (!corpPublicInfo) continue;

      if (copiedMap.has(corpPublicInfo.corporation_id)) {
        copiedMap.set(
          corpPublicInfo.corporation_id,
          addNewCorporation(esiObject)
        );
      } else {
        updateExistingCorporation(
          copiedMap.get(corpPublicInfo.corporation_id),
          esiObject
        );
      }
    }
      updateCorpEsiData(copiedMap);
  }

  function removeCorporationObject() {}

  return { updateCorporationObject, removeCorporationObject };
}

function addNewCorporation(esiObject) {
  const { esiCorpPublicInfo, esiCorpDivisions, esiCorpAssets } = esiObject;
  const staticHangars = {
    division: 0,
    name: "Projects",
    assetLocationRef: "CorporationGoalDeliveries",
  };

  if (
    !existingCorpObject ||
    !esiCorpPublicInfo ||
    !esiCorpDivisions ||
    !esiCorpAssets
  )
    return;

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
  };
}

function updateExistingCorporation(existingCorpObject, esiObject) {
  const { esiCorpPublicInfo, esiCorpDivisions, esiCorpAssets } = esiObject;

  if (
    !existingCorpObject ||
    !esiCorpPublicInfo ||
    !esiCorpDivisions ||
    !esiCorpAssets
  )
    return;
  saveCorporationAssets(esiCorpPublicInfo, esiCorpAssets);

  const officeLocations = esiCorpAssets.reduce((prev, asset) => {
    if (asset.location_flag === "OfficeFolder") {
      prev.add(asset.location_id);
    }
    return prev;
  }, new Set());

  if (esiCorpDivisions && (!existingCorp.hangar || !existingCorp.wallet)) {
    existingCorp.hangars = esiCorpDivisions.hangar;
    existingCorp.wallets = esiCorpDivisions.wallet;
  }
  existingCorp.officeLocations = [
    ...new Set([...officeLocations, ...existingCorp.officeLocations]),
  ];
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
