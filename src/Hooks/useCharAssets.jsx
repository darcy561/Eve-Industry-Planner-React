import { useContext, useMemo } from "react";
import { UsersContext } from "../Context/AuthContext";
import { EveIDsContext } from "../Context/EveDataContext";
import { useEveApi } from "./useEveApi";

export function useCharAssets() {
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { IDtoName } = useEveApi();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const retrieveAssetLocation = (initialAsset, userAssets) => {
    let parentAsset = userAssets.find(
      (i) => i.item_id === initialAsset.location_id
    );
    if (parentAsset === undefined) {
      return initialAsset;
    }
    if (
      parentAsset.location_type === "item" ||
      parentAsset.location_type === "other"
    ) {
      retrieveAssetLocation(parentAsset, userAssets);
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

    updateEveIDs(newEveIDs);

    return itemLocations;
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
        if (!eveIDs.some((i) => item.type_id === i.type_id)) {
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
              parentLocation.location_type !== "other"
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

  return { findItemAssets, getAssetLocationList, retrieveAssetLocation };
}
