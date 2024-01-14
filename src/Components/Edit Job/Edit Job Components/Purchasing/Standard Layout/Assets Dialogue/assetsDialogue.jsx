import { useContext, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../../../Context/EveDataContext";
import { useAssetHelperHooks } from "../../../../../../Hooks/AssetHooks/useAssetHelper";
import { useEveApi } from "../../../../../../Hooks/useEveApi";
import { LoadingAssetData } from "./loadingData";
import { DefaultLocationAssets } from "./defaultLocationAssets";
import { AssetLocations_AssetDialogWindow } from "./assetLocations";
import { CharacterSelector_AssetDialog } from "./characterSelector";
import { CorporationSelector_AssetDialog } from "./corporationSelector";
import { NoAssetsFound_AssetsDialog } from "./noAssetsFound";
import { UseCorporationSelector_AssetsDialog } from "./useCoporation";

export function AssetDialogue({
  material,
  itemAssetsDialogTrigger,
  updateItemAssetsDialogTrigger,
}) {
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const [useCorporationAssets, setUseCorporationAssets] = useState(false);
  const [topLevelAssets, setTopLevelAssets] = useState(null);
  const [assetsByLocation, setAssetsByLocation] = useState(null);
  const [assetLocationNames, updateAssetLocationNames] = useState(null);
  const [tempEveIDs, updateTempEveIDs] = useState(eveIDs);
  const { buildAssetTypeIDMaps } = useAssetHelperHooks();
  const {
    selectRequiredAssets,
    selectRequiredUser,
    sortLocationMapsAlphabetically,
  } = useAssetHelperHooks();
  const { fetchAssetLocationNames, fetchUniverseNames } = useEveApi();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const [selectedAsset, setSelectedAsset] = useState(parentUser.CharacterHash);

  function handleClose() {
    setTopLevelAssets(null);
    setAssetsByLocation(null);
    updateAssetLocationNames(null);
    updateEveIDs(tempEveIDs);
    updateItemAssetsDialogTrigger(false);
  }

  useEffect(() => {
    async function buildAssetList() {
      if (itemAssetsDialogTrigger) {
        setLoadingAssets(true);

        const requiredUserObject = selectRequiredUser(
          selectedAsset,
          useCorporationAssets
        );

        const matchedAssets = selectRequiredAssets(
          selectedAsset,
          useCorporationAssets
        );

        const { assetsByLocationMap, topLevelAssetLocations, assetIDSet } =
          buildAssetTypeIDMaps(matchedAssets, material.typeID);

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
          useCorporationAssets ? "corporation" : "character"
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

        setTopLevelAssets(topLevelAssetLocationsSORTED);
        setAssetsByLocation(assetsByLocationMap);
        updateAssetLocationNames(locationNamesMap);
        updateTempEveIDs(newEveIDs);
        setLoadingAssets(false);
      }
    }
    buildAssetList();
  }, [itemAssetsDialogTrigger, selectedAsset]);

  return (
    <Dialog
      open={itemAssetsDialogTrigger}
      onClose={handleClose}
      sx={{ padding: "20px", width: "100%" }}
    >
      <DialogTitle color="primary" align="center">
        {material.name} Assets
      </DialogTitle>

      <CharacterSelector_AssetDialog
        useCorporationAssets={useCorporationAssets}
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
      />
      <CorporationSelector_AssetDialog
        useCorporationAssets={useCorporationAssets}
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
      />
      <DialogContent sx={{ marginTop: "10px" }}>
        <LoadingAssetData loadingAssets={loadingAssets} />
        <NoAssetsFound_AssetsDialog topLevelAssets={topLevelAssets} />
        <DefaultLocationAssets
          topLevelAssets={topLevelAssets}
          assetsByLocation={assetsByLocation}
          assetLocationNames={assetLocationNames}
          useCorporationAssets={useCorporationAssets}
          tempEveIDs={tempEveIDs}
          loadingAssets={loadingAssets}
        />
        <AssetLocations_AssetDialogWindow
          topLevelAssets={topLevelAssets}
          assetsByLocation={assetsByLocation}
          assetLocationNames={assetLocationNames}
          tempEveIDs={tempEveIDs}
          useCorporationAssets={useCorporationAssets}
          loadingAssets={loadingAssets}
        />
      </DialogContent>
      <DialogActions>
        <UseCorporationSelector_AssetsDialog
          useCorporationAssets={useCorporationAssets}
          setUseCorporationAssets={setUseCorporationAssets}
          parentUser={parentUser}
          setSelectedAsset={setSelectedAsset}
        />
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
