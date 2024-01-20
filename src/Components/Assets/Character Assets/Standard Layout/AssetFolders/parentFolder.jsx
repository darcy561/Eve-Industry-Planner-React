import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AssetEntry_Selector } from "./displaySelector";
import fullItemList from "../../../../../RawData/fullItemList.json";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";
import uuid from "react-uuid";
import GLOBAL_CONFIG from "../../../../../global-config-app";

export function AssetEntry_Parent({
  assetObject,
  matchedAssets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  depth,
  index,
}) {
  const [expanded, updateExpanded] = useState(false);
  const theme = useTheme();
  const { PRIMARY_THEME, SECONDARY_THEME } = GLOBAL_CONFIG;
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const marginValue = deviceNotMobile ? 5 : 3;
  const bottomPaddingValue = deviceNotMobile ? 1 : 2;
  const itemName =
    (fullItemList[assetObject.type_id]?.name ||
      `Unknown Item - ${assetObject.type_id}`) +
    (assetLocationNames.has(assetObject.item_id)
      ? ` - ${assetLocationNames.get(assetObject.item_id)?.name}`
      : "");

  function calculateRowBackround() {
    const currentTheme = theme.palette.mode;
    const isEvenPosition = index % 2 === 0;
    if (currentTheme === PRIMARY_THEME) {
      if (isEvenPosition) {
        return theme.palette.secondary.dark;
      } else {
        return theme.palette.secondary.highlight;
      }
    }

    if (currentTheme === SECONDARY_THEME) {
      if (isEvenPosition) {
        return theme.palette.secondary.light;
      } else {
        return theme.palette.secondary.highlight;
      }
    }
  }

  function toggleClick() {
    updateExpanded((prev) => !prev);
  }
  return (
    <Grid
      container
      sx={{
        paddingBottom: expanded ? bottomPaddingValue : 0,
        marginLeft: marginValue * depth,
        backgroundColor: calculateRowBackround(),
      }}
    >
      <Grid container item xs={12}>
        <Grid item xs={1} sx={{ paddingLeft: deviceNotMobile ? 1 : 0 }}>
          <Box
            height="100%"
            display="flex"
            justifyContent="left"
            alignItems="center"
          >
            <Avatar
              src={`https://images.evetech.net/types/${assetObject.type_id}/icon?size=32`}
              alt={itemName}
              variant="square"
              sx={{
                height: deviceNotMobile ? 32 : 24,
                width: deviceNotMobile ? 32 : 24,
              }}
            />
          </Box>
        </Grid>
        <Grid
          item
          xs={9}
          sm={10}
          display="flex"
          justifyContent="left"
          alignItems="center"
        >
          <Typography
            sx={{ typography: deviceNotMobile ? "body1" : "caption" }}
          >
            {itemName}
          </Typography>
        </Grid>
        <Grid
          item
          xs={2}
          sm={1}
          display="flex"
          justifyContent="right"
          alignItems="center"
          sx={{ paddingRight: deviceNotMobile ? 2 : 1 }}
        >
          <IconButton size="small" onClick={toggleClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Grid>
      </Grid>
      {expanded ? (
        <ExpandedAssetDisplay
          matchedAssets={matchedAssets}
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
  matchedAssets,
  assetLocations,
  topLevelAssets,
  assetLocationNames,
  characterBlueprintsMap,
  depth,
}) {
  matchedAssets.sort((a, b) => {
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
      {matchedAssets.map((asset, index) => {
        return (
          <AssetEntry_Selector
            key={uuid()}
            assetObject={asset}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
            assetLocationNames={assetLocationNames}
            characterBlueprintsMap={characterBlueprintsMap}
            depth={depth + 1}
            index={index}
          />
        );
      })}
    </>
  );
}
