import { useContext } from "react";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { EveIDsContext } from "../Context/EveDataContext";
import searchData from "../RawData/searchIndex.json";
import { useAssetHelperHooks } from "./AssetHooks/useAssetHelper";
import getWorldData from "../Functions/EveESI/World/getWorldData";

export function useCharAssets() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { eveIDs } = useContext(EveIDsContext);
  const {
    acceptedDirectLocationTypes,
    acceptedExtendedLocationTypes,
    acceptedLocationFlags,
    findAssets,
    retrieveAssetLocation,
  } = useAssetHelperHooks();

  async function getAssetLocationList() {
    try {
      let itemLocations = [];
      let newEveIDs = {};

      for (let user of users) {
        const missingIDSet = new Set();

        const userAssets = await findAssets(user);

        if (!isLoggedIn || !userAssets) {
          return [[], {}];
        }
        for (let asset of userAssets) {
          if (acceptedDirectLocationTypes.has(asset.location_type)) {
            if (!itemLocations.some((i) => i === asset.location_id)) {
              itemLocations.push(asset.location_id);
            }
            checkAndAddLocationID(asset.location_id, missingIDSet);
          }
          if (acceptedExtendedLocationTypes.has(asset.location_type)) {
            let parentLocation = retrieveAssetLocation(asset, userAssets);
            if (parentLocation && parentLocation.location_type !== "other") {
              if (
                !itemLocations.some((i) => i === parentLocation.location_id)
              ) {
                itemLocations.push(parentLocation.location_id);
                checkAndAddLocationID(parentLocation.location_id, missingIDSet);
              }
            }
          }
        }
        const eveIDResults = await getWorldData(missingIDSet, user);
        newEveIDs = { ...newEveIDs, ...eveIDResults };
      }
      for (let item = itemLocations.length - 1; item >= 0; item--) {
        let itemData =
          newEveIDs[itemLocations[item]] || eveIDs[itemLocations[item]];
        if (!itemData || itemData.name === "No Access To Location") {
          itemLocations.splice(item, 1);
        }
      }

      itemLocations.sort((a, b) => {
        let aName = newEveIDs[a]?.name;
        let bName = newEveIDs[b]?.name;
        if (aName < bName) {
          return -1;
        }
        if (aName > bName) {
          return 1;
        }
        return 0;
      });

      function checkAndAddLocationID(requestedID, requestSet) {
        if (!requestedID) return;

        if (!eveIDs[requestedID] || !newEveIDs[requestedID]) {
          requestSet.add(requestedID);
        }
      }

      return { itemLocations, newEveIDs };
    } catch (err) {
      console.error(err.message);
      return [[], {}];
    }
  }

  function findLocationAssets(requiredLocationID) {
    let locationAssets = [];
    let fullAssetList = new Map();
    for (let user of users) {
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );

      if (!isLoggedIn) {
        return { fullAssetList, locationAssets };
      }

      for (let item of userAssets) {
        if (searchData.some((i) => i.blueprintID === item.type_id)) {
          continue;
        }
        if (acceptedDirectLocationTypes.has(item.location_type)) {
          if (item.location_id !== requiredLocationID) {
            continue;
          }
          if (locationAssets.some((i) => i.type_id === item.type_id)) {
            let index = locationAssets.findIndex(
              (i) => i.type_id === item.type_id
            );
            if (index !== -1) {
              locationAssets[index].itemIDs.push(item.item_id);
            }
          } else {
            locationAssets.push({
              type_id: item.type_id,
              itemIDs: [item.item_id],
            });
          }
        }

        if (acceptedExtendedLocationTypes.has(item.location_type)) {
          let parentLocation = retrieveAssetLocation(item, userAssets);
          if (!parentLocation && item.location_flag !== "Cargo") {
            continue;
          }
          if (item.location_id !== requiredLocationID) {
            if (parentLocation.location_id !== requiredLocationID) {
              continue;
            }
          }
          if (
            parentLocation.item_id === item.location_id ||
            parentLocation.item_id === item.item_id
          ) {
            if (!acceptedLocationFlags.has(item.location_flag)) {
              continue;
            }

            if (locationAssets.some((i) => i.type_id === item.type_id)) {
              let index = locationAssets.findIndex(
                (i) => i.type_id === item.type_id
              );
              if (index !== -1) {
                locationAssets[index].itemIDs.push(item.item_id);
              }
            } else {
              locationAssets.push({
                type_id: item.type_id,
                itemIDs: [item.item_id],
              });
            }
          }
        }
      }
      fullAssetList.set(user.CharacterHash, userAssets);
    }
    return { fullAssetList, locationAssets };
  }

  return {
    findLocationAssets,
    getAssetLocationList,
    retrieveAssetLocation,
  };
}
