import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import {
  CorpEsiDataContext,
  EveIDsContext,
} from "../../../../Context/EveDataContext";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { useEveApi } from "../../../../Hooks/useEveApi";
import { AssetsPage_Loading } from "../../Character Assets/Standard Layout/loadingPage";
import { AssetEntry_TopLevel } from "../../Character Assets/Standard Layout/AssetFolders/topLevelFolder";
import uuid from "react-uuid";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function AssetLocationFlagPage_Corporation({
  selectedCorporation,
  assetLocationFlagRequest,
}) {
  const { users } = useContext(UsersContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const [corporationBlueprintsMap, updateCorporationBlueprintsMap] =
    useState(null);
  const { buildAssetLocationFlagMaps, sortLocationMapsAlphabetically } =
    useAssetHelperHooks();
  const { findUniverseItemObject } = useHelperFunction();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();

  const matchedCorporation = corpEsiData.get(selectedCorporation);

  useEffect(() => {
    async function buildCorporationAssetsTree() {
      const requiredUserObject = users.find(
        (i) => i.corporation_id === selectedCorporation
      );
      const assetsJSON = JSON.parse(
        sessionStorage.getItem(
          `corpAssets_${matchedCorporation.corporation_id}`
        )
      );

      const corporationBlueprints = new Map();

      for (const [key, value] of Object.entries(
        corpEsiBlueprints.get(selectedCorporation)
      )) {
        const numericKey = Number(key);
        corporationBlueprints.set(numericKey, value);
      }

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
        "corporation"
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
      updateCorporationBlueprintsMap(corporationBlueprints);
      updateAssetLocations(assetsByLocationMap);
    }
    buildCorporationAssetsTree();
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
            characterBlueprintsMap={corporationBlueprintsMap}
            depth={depth}
          />
        );
      })}
    </>
  );
}
