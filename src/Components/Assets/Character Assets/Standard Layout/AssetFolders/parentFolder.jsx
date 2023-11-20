import { Avatar, Grid, IconButton, Typography } from "@mui/material";
import { AssetEntry_Selector } from "./displaySelector";
import fullItemList from "../../../../../RawData/fullItemList.json";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useState } from "react";

export function AssetEntry_Parent({
  assetObject,
  matchedAssets,
  assetLocations,
  topLevelAssets,
}) {
  const [expanded, updateExpanded] = useState(false);

  const itemName =
    fullItemList.find((i) => assetObject.type_id === i.type_id)?.name ||
    "Unkown Item";

  function toggleClick() {
    updateExpanded((prev) => !prev);
  }
  return (
    <Grid container>
      <Grid container item xs={12}>
        <Grid item xs={1}>
          <Avatar
            src={`https://images.evetech.net/types/${assetObject.type_id}/icon?size=32`}
            alt={itemName}
            variant="square"
            sx={{ height: 32, width: 32 }}
          />
        </Grid>
        <Grid item xs={10}>
          <Typography variant="body1"> {itemName}</Typography>
        </Grid>
        <Grid item xs={1} align="right">
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
        />
      ) : null}
    </Grid>
  );
}

function ExpandedAssetDisplay({
  matchedAssets,
  assetLocations,
  topLevelAssets,
}) {
    matchedAssets.sort((a, b) => {
        let aName = fullItemList.find((i) => i.type_id === a.type_id)?.name;
        let bName = fullItemList.find((i) => i.type_id === b.type_id)?.name;
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
      {matchedAssets.map((asset) => {
        return (
          <AssetEntry_Selector
            assetObject={asset}
                assetLocations={assetLocations}
                topLevelAssets={topLevelAssets}
          />
        );
      })}
    </>
  );
}
