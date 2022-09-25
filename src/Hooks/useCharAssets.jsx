import { useContext, useMemo } from "react";
import { UsersContext } from "../Context/AuthContext";
import { EveIDsContext } from "../Context/EveDataContext";
import { useEveApi } from "./useEveApi";
import searchData from "../RawData/searchIndex.json";

export function useCharAssets() {
  const { users } = useContext(UsersContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { IDtoName } = useEveApi();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const retrieveAssetLocation = (initialAsset, userAssets) => {
    let parentAsset = userAssets.find(
      (i) => i.item_id === initialAsset.location_id
    );
    if (parentAsset == undefined) {
      return initialAsset;
    }
    if (
      parentAsset.location_type === "item" ||
      parentAsset.location_type === "other"
    ) {
      return retrieveAssetLocation(parentAsset, userAssets);
    }
    if (
      parentAsset.location_type === "station" ||
      parentAsset.location_type === "solar_system"
    ) {
      return parentAsset;
    }
  };

  const getAssetLocationList = async () => {
    let itemLocations = [];
    let newEveIDs = [...eveIDs];
    let missingStationIDs = new Set();
    for (let user of users) {
      let missingCitadelIDs = new Set();
      let userAssets = JSON.parse(
        sessionStorage.getItem(`assets_${user.CharacterHash}`)
      );

      for (let asset of userAssets) {
        if (
          asset.location_type === "station" ||
          asset.location_type === "solar_system"
        ) {
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
        if (asset.location_type === "item" || asset.location_type === "other") {
          let parentLocation = retrieveAssetLocation(asset, userAssets);
          if (
            parentLocation !== undefined &&
            parentLocation.location_type !== "other"
          ) {
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
      let aName = newEveIDs.find((i) => i.id === a);
      let bName = newEveIDs.find((i) => i.id === b);
      if (aName.name < bName.name) {
        return -1;
      }
      if (aName.name > bName.name) {
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
        if (
          item.location_type === "station" ||
          item.location_type === "solar_system"
        ) {
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
        if (item.location_type === "item" || item.location_type === "other") {
          let parentLocation = retrieveAssetLocation(item, userAssets);
          if (
            parentLocation !== undefined &&
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

      for (let item of userAssets) {
        if (searchData.some((i) => i.blueprintID === item.type_id)) {
          continue;
        }
        if (
          item.location_type === "station" ||
          item.location_type === "solar_system"
        ) {
          if (item.location_id !== requiredLocationID) {
            continue;
          }
          if (searchData.some((i) => i.blueprintID === item.type_id)) {
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

        if (item.location_type === "item" || item.location_type === "other") {
          let parentLocation = retrieveAssetLocation(item, userAssets);
          if (parentLocation === undefined && item.location_flag !== "Cargo") {
            continue;
          }
          if (item.location_id !== requiredLocationID) {
            if (parentLocation.location_id !== requiredLocationID) {
              continue;
            }
          }
          if (item.type_id === 62678) {
            console.log(item);
            console.log(parentLocation);
          }
          if (
            parentLocation.item_id === item.location_id ||
            parentLocation.item_id === item.item_id
          ) {
            if (
              item.location_flag !== "Hangar" &&
              item.location_flag !== "Unlocked" &&
              item.location_flag !== "AutoFit"
            ) {
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
