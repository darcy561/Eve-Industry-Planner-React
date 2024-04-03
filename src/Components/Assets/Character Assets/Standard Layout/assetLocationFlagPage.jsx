import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { useEveApi } from "../../../../Hooks/useEveApi";
import { AssetsPage_Loading } from "./loadingPage";
import { AssetEntry_TopLevel } from "./AssetFolders/topLevelFolder";
import uuid from "react-uuid";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function AssetLocationFlagPage_Character({
  selectedCharacter,
  assetLocationFlagRequest,
}) {
  const { users } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const {
    buildAssetLocationFlagMaps,
    sortLocationMapsAlphabetically,
    getRequestedAssets,
  } = useAssetHelperHooks();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();
  const { findUniverseItemObject } = useHelperFunction();

  useEffect(() => {
    async function buildCharacterAssetsTree() {
      const requiredUserObject = users.find(
        (i) => i.CharacterHash === selectedCharacter
      );
      const assetsJSON = await getRequestedAssets(selectedCharacter);

      const { topLevelAssetLocations, assetsByLocationMap, assetIDSet } =
        buildAssetLocationFlagMaps(assetsJSON, assetLocationFlagRequest);

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
    }
    buildCharacterAssetsTree();
  }, []);

  if (!assetLocations || !topLevelAssets) return <AssetsPage_Loading />;

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets]) => {
        let depth = 1;
        return (
          <AssetEntry_TopLevel
            key={uuid()}
            locationID={locationID}
            assets={assets}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
            assetLocationNames={assetLocationNames}
            depth={depth}
          />
        );
      })}
    </>
  );
}
