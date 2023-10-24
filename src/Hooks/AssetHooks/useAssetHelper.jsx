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
    const tree = {};
    
    const itemMap = new Map(); // To store items by item_id for quick access
    
    // Create a map for quick access to items by item_id
    flatList.forEach(item => {
      itemMap.set(item.item_id, item);
    });
    
    // Recursively build the tree
    function buildSubtree(location_id) {
      const children = flatList.filter(item => item.location_id === location_id);
      
      if (children.length > 0) {
        for (const child of children) {
          if (!tree[location_id]) {
            tree[location_id] = [];
          }
          tree[location_id].push(child);
          
          const childId = child.item_id;
          if (itemMap.has(childId)) {
            buildSubtree(childId);
          }
        }
      }
    }
    
    // Start building the tree from the root nodes (location_id not found as an item_id)
    flatList.forEach(item => {
      if (!itemMap.has(item.location_id)) {
        buildSubtree(item.location_id);
      }
    });
    
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
