import { useContext, useEffect, useState } from "react";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { UsersContext } from "../../../../Context/AuthContext";
import { useEveApi } from "../../../../Hooks/useEveApi";
import {
  EveIDsContext,
  PersonalESIDataContext,
} from "../../../../Context/EveDataContext";
import { AssetEntry_TopLevel } from "./AssetFolders/topLevelFolder";
import { AssetsPage_Loading } from "./loadingPage";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function AssetsPage_Character({ selectedCharacter }) {
  const { users } = useContext(UsersContext);
  const {updateEveIDs } = useContext(EveIDsContext);
  const { esiBlueprints } = useContext(PersonalESIDataContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const [characterBlueprintsMap, updateCharacterBlueprintsMap] = useState(null);
  const { buildAssetMaps, sortLocationMapsAlphabetically } =
    useAssetHelperHooks();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();
  const { findUniverseItemObject } = useHelperFunction();

  useEffect(() => {
    async function buildCharacterAssetsTree() {
      const requiredUserObject = users.find(
        (i) => i.CharacterHash === selectedCharacter
      );

      const characterBlueprints =
        esiBlueprints.find((i) => i.user === selectedCharacter)?.data || [];
      const blueprintsMap = new Map(
        characterBlueprints.map((i) => [i.item_id, i])
      );

      const assetsJSON = JSON.parse(
        sessionStorage.getItem(`assets_${selectedCharacter}`)
      );

      const filteredAssets = assetsJSON.filter(
        (i) => i.location_flag !== ("AssetSafety" && "Deliveries")
      );

      const { topLevelAssetLocations, assetsByLocationMap, assetIDSet } =
        buildAssetMaps(filteredAssets);

      const requiredLocationID = [...topLevelAssetLocations.keys()].reduce(
        (prev, locationID) => {
          const matchedID = findUniverseItemObject(locationID);

          if (!matchedID) {
            prev.add(locationID);
          } else {
            if (matchedID.unResolvedLocation) {
              prev.add(locationID);
            }
          }
          return prev;
        },
        new Set()
      );

      const locationNamesMap = await fetchAssetLocationNames(
        requiredUserObject,
        [...assetIDSet],
        "character"
      );

      const additonalIDObjects = await fetchUniverseNames(
        [...requiredLocationID],
        requiredUserObject
      );

      const topLevelAssetLocationsSORTED = sortLocationMapsAlphabetically(
        topLevelAssetLocations,
        additonalIDObjects
      );

      updateEveIDs((prev) => ({ ...prev, ...additonalIDObjects }));
      updateAssetLocationNames(locationNamesMap);
      updateTopLevelAssets(topLevelAssetLocationsSORTED);
      updateAssetLocations(assetsByLocationMap);
      updateCharacterBlueprintsMap(blueprintsMap);
    }
    buildCharacterAssetsTree();
  }, []);

  if (
    !assetLocations ||
    !topLevelAssets ||
    !assetLocationNames ||
    !characterBlueprintsMap
  )
    return <AssetsPage_Loading />;

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets], index) => {
        let depth = 1;
        return (
          <AssetEntry_TopLevel
            locationID={locationID}
            assets={assets}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
            assetLocationNames={assetLocationNames}
            characterBlueprintsMap={characterBlueprintsMap}
            depth={depth}
            index={index}
          />
        );
      })}
    </>
  );
}
