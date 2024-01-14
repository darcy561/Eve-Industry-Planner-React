import { Grid, Typography } from "@mui/material";
import fullItemList from "../../../../../../../RawData/fullItemList.json";
import { AssetLocationLogic_AssetDialogWindow } from "./templateLogic";
import { useAssetHelperHooks } from "../../../../../../../Hooks/AssetHooks/useAssetHelper";

export function AssetContainerTemplate_AssetDialogWindow({
  assetObject,
  matchedAssets,
  assetsByLocation,
  assetLocationNames,
  useCorporationAssets
}) {
  const { buildAssetName } = useAssetHelperHooks();

  const itemName = buildAssetName(assetObject, assetLocationNames, useCorporationAssets)

  return (
    <Grid container item xs={12}>
      <Grid item xs={12}>
        <Typography variant="body2">{itemName}</Typography>
      </Grid>
      <Grid container item xs={12}>
        {matchedAssets.map((asset) => {
          return (
            <AssetLocationLogic_AssetDialogWindow
              key={asset.item_id}
              assetObject={asset}
              matchedAssets={matchedAssets}
              assetsByLocation={assetsByLocation}
              assetLocationNames={assetLocationNames}
              useCorporationAssets={useCorporationAssets}
            />
          );
        })}
      </Grid>
    </Grid>
  );
}
