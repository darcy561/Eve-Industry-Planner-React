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

export function AssetLocationFlagPage_Corporation({
  selectedCorporation,
  assetLocationFlagRequest,
}) {
  const { users } = useContext(UsersContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const { buildAssetLocationFlagMaps, sortLocationMapsAlphabetically } =
    useAssetHelperHooks();
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

      const { topLevelAssetLocations, assetsByLocationMap, assetIDSet } =
        buildAssetLocationFlagMaps(assetsJSON, assetLocationFlagRequest);

      const requiredLocationID = [...topLevelAssetLocations.keys()].reduce(
        (prev, locationID) => {
          const matchedID = eveIDs.find((i) => i.id === locationID);

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

      const newEveIDs = [
        ...eveIDs.filter(
          (firstObj) =>
            !additonalIDObjects.some(
              (secondObj) => firstObj.id === secondObj.id
            )
        ),
        ...additonalIDObjects,
      ];

      const topLevelAssetLocationsSORTED = sortLocationMapsAlphabetically(
        topLevelAssetLocations,
        newEveIDs
      );

      updateEveIDs(newEveIDs);
      updateAssetLocationNames(locationNamesMap);
      updateTopLevelAssets(topLevelAssetLocationsSORTED);
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
            depth={depth}
          />
        );
      })}
    </>
  );
}
