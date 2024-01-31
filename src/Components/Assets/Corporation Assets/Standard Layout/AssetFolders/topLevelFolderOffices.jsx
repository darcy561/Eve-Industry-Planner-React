import { Grid, IconButton, Typography, useMediaQuery } from "@mui/material";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import uuid from "react-uuid";
import { AssetEntry_CorpOffices } from "./officesParentFolder";
import { useHelperFunction } from "../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function AssetEntry_TopLevel_CorporationOffices({
  locationID,
  assets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  matchedCorporation,
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
          assets={assets}
          assetLocations={assetLocations}
          topLevelAssets={topLevelAssets}
          assetLocationNames={assetLocationNames}
          characterBlueprintsMap={characterBlueprintsMap}
          matchedCorporation={matchedCorporation}
          depth={depth}
        />
      ) : null}
    </Grid>
  );
}

function ExpandedAssetDisplay({
  assets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  matchedCorporation,
  depth,
}) {
  return (
    <>
      {matchedCorporation.hangars.map((hangarObject, index) => {
        return (
          <AssetEntry_CorpOffices
            key={uuid()}
            hangarObject={hangarObject}
            assets={assets}
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
