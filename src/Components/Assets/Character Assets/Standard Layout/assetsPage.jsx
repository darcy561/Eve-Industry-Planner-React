import { useContext, useEffect, useState } from "react";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { AssetEntry_Parent } from "./AssetFolders/parentFolder";
import { AssetEntry_Selector } from "./AssetFolders/displaySelector";
import { Grid, Typography, useControlled } from "@mui/material";
import { UsersContext } from "../../../../Context/AuthContext";
import { useEveApi } from "../../../../Hooks/useEveApi";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { AssetEntry_TopLevel } from "./AssetFolders/topLevelFolder";
import { AssetsPage_Loading } from "./loadingPage";

export function AssetsPage_Character({
  selectedCharacter
}) {
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const [topLevelAssets, updateTopLevelAssets] = useState(null);
  const [assetLocations, updateAssetLocations] = useState(null);
  const { buildAssetMaps, findBlueprintTypeIDs } = useAssetHelperHooks();
  const { IDtoName } = useEveApi();

  useEffect(() => {
    async function buildCharacterAssetsTree() {
      const assetsJSON = JSON.parse(
        sessionStorage.getItem(`assets_${selectedCharacter}`)
      );
      const blueprintTypeIDsSet = findBlueprintTypeIDs();
      const filteredAssets = assetsJSON.filter(
        (i) =>
          !blueprintTypeIDsSet.has(i.type_id) &&
          i.location_flag !== ("AssetSafety" || "Deliveries")
      );
      const { topLevelAssetLocations, assetsByLocationMap } =
        buildAssetMaps(filteredAssets);
      const requiredLocationID = [];
      const requiredUserObject = users.find(
        (i) => i.CharacterHash === selectedCharacter
      );

      for (let locationID of Array.from(topLevelAssetLocations.keys())) {
        if (!eveIDs.some((i) => i.id === locationID)) {
          requiredLocationID.push(locationID);
        }
      }

      const newIDData = await IDtoName(requiredLocationID, requiredUserObject);

      updateEveIDs((prev) => [...prev, ...newIDData]);
      updateTopLevelAssets(topLevelAssetLocations);
      updateAssetLocations(assetsByLocationMap);
    }
    buildCharacterAssetsTree();
  }, []);

  if (!assetLocations || !topLevelAssets) return <AssetsPage_Loading/>

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets]) => {
        return (
          <AssetEntry_TopLevel
            locationID={locationID}
            assets={assets}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
          />
        );
      })}
    </>
  );
}
