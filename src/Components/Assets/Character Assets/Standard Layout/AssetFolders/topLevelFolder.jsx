import { Grid, IconButton, Typography, useMediaQuery } from "@mui/material";
import { AssetEntry_Selector } from "./displaySelector";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import fullItemList from "../../../../../RawData/fullItemList.json";
import uuid from "react-uuid";

export function AssetEntry_TopLevel({
  locationID,
  assets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  depth,
}) {
  const [expanded, updateExpanded] = useState(false);
  const { findUniverseItemObject } = useHelperFunction();
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const itemLocationName =
    findUniverseItemObject(locationID)?.name || "Unkown Location";

  function toggleClick() {
    updateExpanded((prev) => !prev);
  }

  return (
    <Grid container>
      <Grid container item xs={12}>
        <Grid
          item
          xs={2}
          sm={1}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <IconButton size="small" onClick={toggleClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Grid>
        <Grid
          container
          item
          xs={10}
          sm={11}
          display="flex"
          justifyContent="left"
          alignItems="center"
        >
          <Typography
            sx={{ typography: deviceNotMobile ? "body1" : "caption" }}
          >
            {itemLocationName}
          </Typography>
        </Grid>
      </Grid>
      {expanded ? (
        <ExpandedAssetDisplay
          locationID={locationID}
          assets={assets}
          assetLocations={assetLocations}
          topLevelAssets={topLevelAssets}
          assetLocationNames={assetLocationNames}
          characterBlueprintsMap={characterBlueprintsMap}
          depth={depth}
        />
      ) : null}
    </Grid>
  );
}

function ExpandedAssetDisplay({
  locationID,
  assets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  depth,
}) {
  assets.sort((a, b) => {
    let aName = fullItemList[a.type_id]?.name;
    let bName = fullItemList[b.type_id]?.name;
    if (!aName || !bName) {
      return 0;
    }
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });

  return (
    <>
      {assets.map((asset, index) => {
        return (
          <AssetEntry_Selector
            key={uuid()}
            assetObject={asset}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
            assetLocationNames={assetLocationNames}
            characterBlueprintsMap={characterBlueprintsMap}
            depth={depth}
            index={index}
          />
        );
      })}
    </>
  );
}
