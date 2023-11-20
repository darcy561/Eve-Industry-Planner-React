import searchData from "../../RawData/searchIndex.json";

export function useAssetHelperHooks() {
  const acceptedDirectLocationTypes = new Set(["station", "solar_system"]);
  const acceptedExtendedLocationTypes = new Set(["item", "other"]);
  const acceptedLocationFlags = new Set([
    "Hangar",
    "Unlocked",
    "AutoFit",
    "CorpSAG1",
    "CorpSAG2",
    "CorpSAG3",
    "CorpSAG4",
    "CorpSAG5",
    "CorpSAG6",
    "CorpSAG7",
    "CorporationGoalDeliveries",
  ]);

  function formatLocation(locationFlag) {
    switch (locationFlag) {
      case "Hangar":
        return "Hangar";
      case "Unlocked":
      case "Autofit":
        return "Container";
      default:
        return "Other";
    }
  }

  function retrieveAssetLocation(initialAsset, userAssets) {
    let parentAsset = userAssets.find(
      (i) => i.item_id === initialAsset.location_id
    );
    if (!parentAsset) {
      return initialAsset;
    }
    if (acceptedExtendedLocationTypes.has(parentAsset.location_type)) {
      return retrieveAssetLocation(parentAsset, userAssets);
    }
    if (acceptedDirectLocationTypes.has(parentAsset.location_type)) {
      return parentAsset;
    }
  }

  function buildAssetMaps(assetList) {
    const assetItemMap = new Map();
    const assetsByLocationMap = new Map();
    const topLevelAssetLocations = new Map();


    assetList.forEach((item) => {
      const locationId = item.location_id;
      assetItemMap.set(item.item_id, item);
      if (assetsByLocationMap.has(locationId)) {
        assetsByLocationMap.get(locationId).push(item);
      } else {
        assetsByLocationMap.set(locationId, [item]);
      }
    });

    assetsByLocationMap.forEach((items, locationId) => {
      items.forEach((item) => {
        const assetLocation = item.location_id;
        if (!assetItemMap.has(assetLocation)) {
          topLevelAssetLocations.set(locationId, items);
        }
      });
    });
    
    
    return {topLevelAssetLocations, assetItemMap, assetsByLocationMap}
  }


  function findBlueprintTypeIDs() {
    return searchData.reduce((prev, { blueprintID }) => {
      return prev.add(blueprintID);
    }, new Set());
  }

  return {
    acceptedDirectLocationTypes,
    acceptedExtendedLocationTypes,
    acceptedLocationFlags,
    buildAssetMaps,
    findBlueprintTypeIDs,
    formatLocation,
    retrieveAssetLocation,
  };
}
