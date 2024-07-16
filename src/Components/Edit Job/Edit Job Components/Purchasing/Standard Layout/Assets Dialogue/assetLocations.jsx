import { useContext } from "react";
import { ApplicationSettingsContext } from "../../../../../../Context/LayoutContext";
import { AssetLocationLogic_AssetDialogWindow } from "./AssetTemplates/templateLogic";
import { Grid, Typography } from "@mui/material";

export function AssetLocations_AssetDialogWindow({
  topLevelAssets,
  assetsByLocation,
  assetLocationNames,
  tempEveIDs,
  useCorporationAssets,
  loadingAssets,
}) {
  const { applicationSettings } = useContext(ApplicationSettingsContext);

  if (
    !topLevelAssets ||
    !assetsByLocation ||
    !assetLocationNames ||
    loadingAssets
  )
    return null;

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets]) => {
        if (locationID === applicationSettings.defaultAssetLocation)
          return null;

        const itemLocationName =
          tempEveIDs[locationID]?.name || "Unkown Location";
        return (
          <Grid key={locationID} container>
            <Grid item xs={12}>
              <Typography>{itemLocationName} </Typography>
            </Grid>

            {assets.map((assetObject) => {
              return (
                <AssetLocationLogic_AssetDialogWindow
                  key={assetObject.item_id}
                  assetObject={assetObject}
                  assetsByLocation={assetsByLocation}
                  assetLocationNames={assetLocationNames}
                  useCorporationAssets={useCorporationAssets}
                />
              );
            })}
          </Grid>
        );
      })}
    </>
  );
}
