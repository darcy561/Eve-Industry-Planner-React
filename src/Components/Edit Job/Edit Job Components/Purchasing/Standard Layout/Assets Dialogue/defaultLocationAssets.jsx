import { useContext } from "react";
import { ApplicationSettingsContext } from "../../../../../../Context/LayoutContext";
import { Grid, Typography } from "@mui/material";
import { AssetLocationLogic_AssetDialogWindow } from "./AssetTemplates/templateLogic";

export function DefaultLocationAssets({
  topLevelAssets,
  assetsByLocation,
  assetLocationNames,
  useCorporationAssets,
  tempEveIDs,
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

  const locationAssets = topLevelAssets.get(
    applicationSettings.defaultAssetLocation
  );

  if (!locationAssets) return null;

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets]) => {
        if (locationID !== applicationSettings.defaultAssetLocation)
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
