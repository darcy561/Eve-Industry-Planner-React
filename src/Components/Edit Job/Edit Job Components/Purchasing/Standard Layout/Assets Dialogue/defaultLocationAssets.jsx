import { useContext, useMemo } from "react";
import { UsersContext } from "../../../../../../Context/AuthContext";
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
  const { users } = useContext(UsersContext);

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const defaultAssetLocation = parentUser.settings.editJob.defaultAssetLocation;

  if (
    !topLevelAssets ||
    !assetsByLocation ||
    !assetLocationNames ||
    loadingAssets
  )
    return null;

  const locationAssets = topLevelAssets.get(defaultAssetLocation);

  if (!locationAssets) return null;

  return (
    <>
      {Array.from(topLevelAssets).map(([locationID, assets]) => {
        if (locationID !== defaultAssetLocation) return null;

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
