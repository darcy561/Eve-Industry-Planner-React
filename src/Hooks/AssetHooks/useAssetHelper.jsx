import searchData from "../../RawData/searchIndex.json";
import { ancientRelicIDs } from "../../Context/defaultValues";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { CorpEsiDataContext } from "../../Context/EveDataContext";
import fullItemList from "../../RawData/fullItemList.json";

export function useAssetHelperHooks() {
  const { users } = useContext(UsersContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);

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
    const assetIDSet = new Set();

    assetList.forEach((item) => {
      const locationId = item.location_id;
      assetItemMap.set(item.item_id, item);

      if (assetsByLocationMap.has(locationId)) {
        assetsByLocationMap.get(locationId).push(item);
      } else {
        assetsByLocationMap.set(locationId, [item]);
      }
    });

    assetList.forEach(({ item_id }) => {
      if (assetsByLocationMap.has(item_id)) {
        assetIDSet.add(item_id);
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

    return {
      topLevelAssetLocations,
      assetItemMap,
      assetsByLocationMap,
      assetIDSet,
    };
  }

  function buildAssetMapsCorpOffices(assetList, corporationObject) {
    const officeLocations = corporationObject.officeLocations;
    const hangarArray = corporationObject.hangars;
    const assetsByLocationMap = new Map();
    const topLevelAssetLocations = new Map();
    const assetIDSet = new Set();

    assetList.forEach((item) => {
      const locationID = item.location_id;
      if (assetsByLocationMap.has(locationID)) {
        assetsByLocationMap.get(locationID).push(item);
      } else {
        assetsByLocationMap.set(locationID, [item]);
      }
    });

    officeLocations.forEach((locationID) => {
      const hangarMap = new Map();
      const officeObjectLocation =
        assetsByLocationMap.get(locationID)[0]?.item_id;
      const officeAssets = assetsByLocationMap.get(officeObjectLocation) || [];

      hangarArray.forEach(({ assetLocationRef }) => {
        const filteredAssets = officeAssets.filter(
          (i) => i.location_flag === assetLocationRef
        );

        filteredAssets.forEach(({ item_id }) => {
          if (assetsByLocationMap.has(item_id)) {
            assetIDSet.add(item_id);
          }
        });

        hangarMap.set(assetLocationRef, filteredAssets);
      });

      topLevelAssetLocations.set(locationID, hangarMap);
    });

    return { topLevelAssetLocations, assetsByLocationMap, assetIDSet };
  }

  function buildAssetTypeIDMaps(assetList, requestedTypeID) {
    const assetItemMap = new Map();
    const assetsByLocationMap = new Map();
    const topLevelAssetLocations = new Map();
    const assetIDSet = new Set();

    if (!assetList || !requestedTypeID) {
      return { assetItemMap, assetsByLocationMap, assetIDSet };
    }

    const requestedTypeIDAssets = assetList.filter(
      (asset) => asset.type_id === requestedTypeID
    );

    assetList.forEach((asset) => {
      assetItemMap.set(asset.item_id, asset);
    });

    for (const asset of requestedTypeIDAssets) {
      findParentAsset(asset, assetList, assetsByLocationMap);
    }

    for (const asset of requestedTypeIDAssets) {
      findChildAssets(asset, assetList, assetsByLocationMap);
    }

    assetsByLocationMap.forEach((items, locationID) => {
      items.forEach((item) => {
        const assetLocation = item.location_id;
        if (!assetItemMap.has(assetLocation)) {
          topLevelAssetLocations.set(assetLocation, items);
        }
      });
    });

    assetList.forEach(({ item_id, location_flag }) => {
      if (
        assetsByLocationMap.has(item_id) &&
        location_flag !== "OfficeFolder"
      ) {
        assetIDSet.add(item_id);
      }
    });

    return {
      assetsByLocationMap,
      topLevelAssetLocations,
      assetIDSet,
    };
  }

  function buildAssetLocationFlagMaps(assetList, requestedLocationFlag) {
    const assetItemMap = new Map();
    const assetsByLocationMap = new Map();
    const topLevelAssetLocations = new Map();
    const assetIDSet = new Set();

    if (!assetList || !requestedLocationFlag)
      return { assetsByLocationMap, topLevelAssetLocations, assetIDSet };

    const requestedLocationFlagAssets = assetList.filter(
      (asset) => asset.location_flag === requestedLocationFlag
    );

    assetList.forEach((asset) => {
      assetItemMap.set(asset.item_id, asset);
    });

    for (const initialAsset of requestedLocationFlagAssets) {
      findParentAsset(initialAsset, assetList, assetsByLocationMap);
    }

    for (const initialAsset of requestedLocationFlagAssets) {
      findChildAssets(initialAsset, assetList, assetsByLocationMap);
    }

    assetsByLocationMap.forEach((items, locationId) => {
      items.forEach((item) => {
        const assetLocation = item.location_id;
        if (!assetItemMap.has(assetLocation)) {
          topLevelAssetLocations.set(assetLocation, items);
        }
      });
    });

    assetList.forEach(({ item_id }) => {
      if (assetsByLocationMap.has(item_id)) {
        assetIDSet.add(item_id);
      }
    });

    return { assetsByLocationMap, topLevelAssetLocations, assetIDSet };
  }

  function findParentAsset(initialAsset, assetList, assetsByLocationMap) {
    const parentAsset = assetList.find(
      (asset) => asset.item_id === initialAsset.location_id
    );

    if (parentAsset) {
      const itemID = parentAsset.item_id;
      if (!assetsByLocationMap.has(itemID)) {
        assetsByLocationMap.set(itemID, []);
      }
      const locationAssets = assetsByLocationMap.get(itemID);
      const isItemIncluded = locationAssets.some(
        (i) => i.item_id === parentAsset.item_id
      );
      if (!isItemIncluded) {
        locationAssets.push(initialAsset);
        findParentAsset(parentAsset, assetList, assetsByLocationMap);
      }
    } else {
      const locationID = initialAsset.location_id;
      if (!assetsByLocationMap.has(locationID)) {
        assetsByLocationMap.set(locationID, [initialAsset]);
      } else {
        const locationAssets = assetsByLocationMap.get(locationID);

        const isItemIncluded = locationAssets.some(
          (i) => i.item_id === initialAsset.item_id
        );
        if (!isItemIncluded) {
          locationAssets.push(initialAsset);
        }
      }
    }
  }

  function findChildAssets(initialAsset, assetList, assetsByLocationMap) {
    const children = assetList.filter(
      (asset) => asset.location_id === initialAsset.item_id
    );

    for (const childAsset of children) {
      const locationID = childAsset.location_id;
      if (!assetsByLocationMap.has(locationID)) {
        assetsByLocationMap.set(locationID, [childAsset]);
      } else {
        const locationAssets = assetsByLocationMap.get(locationID);
        const isItemIncluded = locationAssets.some(
          (i) => i.item_id === childAsset.item_id
        );
        if (!isItemIncluded) {
          locationAssets.push(childAsset);
          findChildAssets(childAsset, assetList, assetsByLocationMap);
        }
      }
    }
  }

  function findBlueprintTypeIDs() {
    return searchData.reduce((prev, { blueprintID }) => {
      return prev.add(blueprintID);
    }, new Set());
  }

  function sortLocationMapsAlphabetically(
    inputLocationMap,
    inputLocationNames
  ) {
    return new Map(
      [...inputLocationMap.entries()].sort((a, b) => {
        const nameA =
          inputLocationNames.find((id) => id.id === a[0])?.name || "";
        const nameB =
          inputLocationNames.find((id) => id.id === b[0])?.name || "";

        const noAccessName = "No Access To Location";

        if (nameA.includes(noAccessName) || nameB.includes(noAccessName)) {
          if (nameA.includes(noAccessName) && nameB.includes(noAccessName)) {
            return 0;
          } else if (nameA.includes(noAccessName)) {
            return 1;
          } else if (nameB.includes(noAccessName)) {
            return -1;
          }
        }

        if (!nameA && !nameB) {
          return 0;
        } else if (!nameA) {
          return 1;
        } else if (!nameB) {
          return -1;
        }
        return nameA.localeCompare(nameB);
      })
    );
  }

  function findAssetImageURL(asset, blueprintMap) {
    const typeID = asset.type_id;
    const baseImageUrl = `https://images.evetech.net/types/${typeID}`;

    if (!blueprintMap) {
      return `${baseImageUrl}/icon?size=32`;
    }

    const blueprintObject = blueprintMap.get(asset.item_id);

    if (blueprintObject) {
      if (blueprintObject.quantity === -2) {
        return `${baseImageUrl}/bpc?size=32`;
      }

      if (ancientRelicIDs.has(typeID)) {
        return `${baseImageUrl}/relic?size=32`;
      }

      return `${baseImageUrl}/bp?size=32`;
    }

    return `${baseImageUrl}/icon?size=32`;
  }

  function selectRequiredAssets(requiredItemID, isCorporation) {
    if (!requiredItemID) return [];

    const assetPrefix = isCorporation ? "corpAssets" : "assets";

    return (
      JSON.parse(sessionStorage.getItem(`${assetPrefix}_${requiredItemID}`)) ||
      []
    );
  }

  function selectRequiredUser(requiredID, isCorporation) {
    if (isCorporation) {
      return users.find((i) => i.corporation_id === requiredID);
    } else {
      return users.find((i) => i.CharacterHash === requiredID);
    }
  }

  function buildAssetName(assetObject, assetLocationNames, isCorporation) {
    const corpHangarName = corpLocationName();
    const assetObjectName = findAssetObjectName();
    const customAssetName = findCustomAssetName();

    return [corpHangarName, assetObjectName, customAssetName].join(" - ");

    function corpLocationName() {
      if (!isCorporation) return "";
      const corpHangars =
        corpEsiData.get(assetObject.corporation_id)?.hangars || [];

      return (
        corpHangars.find(
          (i) => i.assetLocationRef === assetObject.location_flag
        )?.name || ""
      );
    }

    function findAssetObjectName() {
      return fullItemList[assetObject.type_id]?.name || "Unknown Item";
    }

    function findCustomAssetName() {
      return assetLocationNames.get(assetObject.item_id)?.name || "";
    }
  }

  return {
    acceptedDirectLocationTypes,
    acceptedExtendedLocationTypes,
    acceptedLocationFlags,
    buildAssetMaps,
    buildAssetMapsCorpOffices,
    buildAssetName,
    buildAssetLocationFlagMaps,
    buildAssetTypeIDMaps,
    findAssetImageURL,
    findBlueprintTypeIDs,
    formatLocation,
    retrieveAssetLocation,
    selectRequiredAssets,
    selectRequiredUser,
    sortLocationMapsAlphabetically,
  };
}
