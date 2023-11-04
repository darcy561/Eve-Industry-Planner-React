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
    "CorporationGoalDeliveries"
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

  function buildItemTree(flatList) {
    const childLocationReference = new Set();
    const tree = [];
  
    // Create a mapping of items by their item_id for quick lookup
    const itemMap = new Map();
    for (const item of flatList) {
      itemMap.set(item.item_id, item);
    }
  
    // Recursively build the tree starting from the root items
    function buildSubtree(location_id) {
      const children = [];
      for (const item of flatList) {
        if (item.location_id === location_id) {
          const child = {
            ...item,
            children: buildSubtree(item.item_id),
          };
          children.push(child);
        }
      }
      return children.length > 0 ? children : null;
    }
  
    for (const item of flatList) {
      if (!itemMap.has(item.location_id)) {
        const rootItem = {
          ...item,
          children: buildSubtree(item.item_id),
        };
        tree.push(rootItem);
      }
    }
  
    return tree;
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
    buildItemTree,
    findBlueprintTypeIDs,
    formatLocation,
    retrieveAssetLocation,
  };
}
