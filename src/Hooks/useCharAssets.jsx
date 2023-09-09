import { useContext, useMemo } from "react";
import { IsLoggedInContext, UsersContext } from "../Context/AuthContext";
import { EveIDsContext } from "../Context/EveDataContext";
import { useEveApi } from "./useEveApi";
import searchData from "../RawData/searchIndex.json";
import { useAssetHelperHooks } from "./AssetHooks/useAssetHelper";

export function useCharAssets() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { IDtoName } = useEveApi();
  const {
    acceptedDirectLocationTypes,
    acceptedExtendedLocationTypes,
    acceptedLocationFlags,
    retrieveAssetLocation
  } = useAssetHelperHooks();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);



  const getAssetLocationList = async () => {
    let itemLocations = [];
    let newEveIDs = [...eveIDs];
    let missingStationIDs = new Set();
    for (let user of users) {
      let missingCitadelIDs = new Set();
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );

      if (!isLoggedIn) {
        return [[], []];
      }

      for (let asset of userAssets) {
        if (acceptedDirectLocationTypes.has(asset.location_type)) {
          if (!newEveIDs.some((i) => i.id === asset.location_id)) {
            if (asset.location_id.toString().length > 10) {
              missingCitadelIDs.add(asset.location_id);
            } else {
              missingStationIDs.add(asset.location_id);
            }
          }
          if (!itemLocations.some((i) => i === asset.location_id)) {
            itemLocations.push(asset.location_id);
          }
        }
        if (acceptedExtendedLocationTypes.has(asset.location_type)) {
          let parentLocation = retrieveAssetLocation(asset, userAssets);
          if (parentLocation && parentLocation.location_type !== "other") {
            if (!itemLocations.some((i) => i === parentLocation.location_id)) {
              if (!newEveIDs.some((i) => i.id === parentLocation.location_id)) {
                if (parentLocation.location_id.toString().length > 10) {
                  missingCitadelIDs.add(parentLocation.location_id);
                } else {
                  missingStationIDs.add(parentLocation.location_id);
                }
              }

              itemLocations.push(parentLocation.location_id);
            }
          }
        }
      }
      if ([...missingCitadelIDs].length > 0) {
        let tempCit = await IDtoName([...missingCitadelIDs], user);
        newEveIDs = newEveIDs.concat(tempCit);
      }
    }
    if ([...missingStationIDs].length > 0) {
      let tempStation = await IDtoName([...missingStationIDs], parentUser);
      newEveIDs = newEveIDs.concat(tempStation);
    }

    for (let item = itemLocations.length - 1; item >= 0; item--) {
      let itemData = newEveIDs.find((i) => i.id === itemLocations[item]);
      if (itemData === undefined || itemData.name === "No Access To Location") {
        itemLocations.splice(item, 1);
      }
    }

    itemLocations.sort((a, b) => {
      let aName = newEveIDs.find((i) => i.id === a)?.name;
      let bName = newEveIDs.find((i) => i.id === b)?.name;
      if (aName < bName) {
        return -1;
      }
      if (aName > bName) {
        return 1;
      }
      return 0;
    });

    return [itemLocations, newEveIDs];
  };

  const findItemAssets = async (requestedItemID) => {
    let filteredAssetList = [];
    let newEveIDs = [...eveIDs];
    let missingStationIDs = new Set();
    let itemLocations = [];
    for (let user of users) {
      let missingCitadelIDs = new Set();
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );
      let filteredUserAssetList = userAssets.filter(
        (entry) => entry.type_id === requestedItemID
      );
      for (let item of filteredUserAssetList) {
        if (acceptedDirectLocationTypes.has(item.location_type)) {
          if (item.location_id.toString().length > 10) {
            missingCitadelIDs.add(item.location_id);
          } else {
            missingStationIDs.add(item.location_id);
          }
          if (itemLocations.some((i) => item.location_id === i.location_id)) {
            let index = itemLocations.findIndex(
              (i) => i.location_id === item.location_id
            );
            if (index !== -1) {
              itemLocations[index].itemIDs.push(item.item_id);
            }
          } else {
            itemLocations.push({
              location_id: item.location_id,
              itemIDs: [item.item_id],
            });
          }
        }
        if (acceptedExtendedLocationTypes.has(item.location_type)) {
          let parentLocation = retrieveAssetLocation(item, userAssets);
          if (
            parentLocation &&
            parentLocation.location_type !== "other" &&
            item.location_flag !== "Cargo"
          ) {
            if (parentLocation.location_id.toString().length > 10) {
              missingCitadelIDs.add(parentLocation.location_id);
            } else {
              missingStationIDs.add(parentLocation.location_id);
            }
            if (
              itemLocations.some(
                (i) => parentLocation.location_id === i.location_id
              )
            ) {
              let index = itemLocations.findIndex(
                (i) => i.location_id === parentLocation.location_id
              );
              if (index !== -1) {
                itemLocations[index].itemIDs.push(item.item_id);
              }
            } else {
              itemLocations.push({
                location_id: parentLocation.location_id,
                itemIDs: [item.item_id],
              });
            }
          }
        }

        if ([...missingCitadelIDs].length > 0) {
          let tempCit = await IDtoName([...missingCitadelIDs], user);
          newEveIDs = newEveIDs.concat(tempCit);
        }
      }
      filteredAssetList = filteredAssetList.concat(filteredUserAssetList);
    }

    if ([...missingStationIDs].length > 0) {
      let tempStation = await IDtoName([...missingStationIDs], parentUser);
      newEveIDs = newEveIDs.concat(tempStation);
    }
    return [filteredAssetList, newEveIDs, itemLocations];
  };

  const findLocationAssets = async (requiredLocationID) => {
    let locationAssets = [];
    let fullAssetList = [];
    for (let user of users) {
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );

      if (!isLoggedIn) {
        return [[], []];
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
      fullAssetList = fullAssetList.concat(userAssets);
    }
    return [fullAssetList, locationAssets];
  };

  return {
    findItemAssets,
    findLocationAssets,
    getAssetLocationList,
    retrieveAssetLocation,
  };
}
