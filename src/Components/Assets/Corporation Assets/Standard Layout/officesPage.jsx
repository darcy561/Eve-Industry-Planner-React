import { useContext, useEffect, useState } from "react";
import {
  CorpEsiDataContext,
  EveIDsContext,
} from "../../../../Context/EveDataContext";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { UsersContext } from "../../../../Context/AuthContext";
import { AssetEntry_TopLevel_CorporationOffices } from "./AssetFolders/topLevelFolderOffices";
import { AssetsPage_Loading } from "../../Character Assets/Standard Layout/loadingPage";
import { useEveApi } from "../../../../Hooks/useEveApi";
import uuid from "react-uuid";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function OfficesPage_Corporation({ selectedCorporation }) {
  const { corpEsiData, corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const { users } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const [characterBlueprintsMap, updateCharacterBlueprintsMap] = useState(null);
  const {
    buildAssetMapsCorpOffices,
    sortLocationMapsAlphabetically,
    getRequestedAssets,
  } = useAssetHelperHooks();
  const { findUniverseItemObject } = useHelperFunction();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();

  const matchedCorporation = corpEsiData.get(selectedCorporation);

  useEffect(() => {
    async function buildCorporationAssestsTree() {
      const requiredUserObject = users.find(
        (i) => i.corporation_id === selectedCorporation
      );

      const corporationBlueprints = new Map();

      for (const [key, value] of Object.entries(
        corpEsiBlueprints.get(selectedCorporation)
      )) {
        const numericKey = Number(key);
        corporationBlueprints.set(numericKey, value);
      }

      const assetsJSON = await getRequestedAssets(
        matchedCorporation.corporation_id,
        true
      );
      const filteredAssets = assetsJSON.filter(
        (i) => i.location_flag !== ("AssetSafety" && "CorpDeliveries")
      );

      const { topLevelAssetLocations, assetsByLocationMap, assetIDSet } =
        buildAssetMapsCorpOffices(filteredAssets, matchedCorporation);

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
      updateAssetLocations(assetsByLocationMap);
      updateCharacterBlueprintsMap(corporationBlueprints);
    }
    buildCorporationAssestsTree();
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
          <AssetEntry_TopLevel_CorporationOffices
            key={uuid()}
            locationID={locationID}
            assets={assets}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
            assetLocationNames={assetLocationNames}
            characterBlueprintsMap={characterBlueprintsMap}
            matchedCorporation={matchedCorporation}
            depth={depth}
            index={index}
          />
        );
      })}
    </>
  );
}
