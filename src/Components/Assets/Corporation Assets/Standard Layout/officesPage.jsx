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

export function OfficesPage_Corporation({ selectedCorporation }) {
  const { corpEsiData, corpEsiBlueprints } = useContext(CorpEsiDataContext);
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const [characterBlueprintsMap, updateCharacterBlueprintsMap] = useState(null);
  const { buildAssetMapsCorpOffices, sortLocationMapsAlphabetically } =
    useAssetHelperHooks();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();

  const matchedCorporation = corpEsiData.get(selectedCorporation);


  useEffect(() => {
    async function buildCorporationAssestsTree() {
      const requiredUserObject = users.find(
        (i) => i.corporation_id === selectedCorporation
      );

      const corporationBlueprints =
        corpEsiBlueprints.find(
          (i) => i.user === requiredUserObject.CharacterHash
        )?.data || [];

      const blueprintsMap = new Map(
        corporationBlueprints.map((i) => [i.item_id, i])
      );

      const assetsJSON = JSON.parse(
        sessionStorage.getItem(
          `corpAssets_${matchedCorporation.corporation_id}`
        )
      );
      const filteredAssets = assetsJSON.filter(
        (i) => i.location_flag !== ("AssetSafety" && "CorpDeliveries")
      );

      const { topLevelAssetLocations, assetsByLocationMap, assetIDSet } =
        buildAssetMapsCorpOffices(filteredAssets, matchedCorporation);

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
      updateCharacterBlueprintsMap(blueprintsMap);
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
        console.log(assets)
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
