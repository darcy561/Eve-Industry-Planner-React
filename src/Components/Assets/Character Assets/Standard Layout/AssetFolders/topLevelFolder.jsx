import { Grid, IconButton, Typography } from "@mui/material";
import { AssetEntry_Selector } from "./displaySelector";
import { useContext, useState } from "react";
import { EveIDsContext } from "../../../../../Context/EveDataContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import fullItemList from "../../../../../RawData/fullItemList.json";

export function AssetEntry_TopLevel({
  locationID,
  assets,
  assetLocations,
  topLevelAssets,
}) {
  const { eveIDs } = useContext(EveIDsContext);
  const [expanded, updateExpanded] = useState(false);
  const itemLocationName =
    eveIDs.find((i) => locationID === i.id)?.name || "Unkown Location";

  function toggleClick() {
    updateExpanded((prev) => !prev);
  }

  return (
    <Grid container>
      <Grid container item xs={12}>
        <Grid item xs={1} align="center">
          <IconButton size="small" onClick={toggleClick}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Grid>
        <Grid container item xs={11}>
          <Typography variant="body1"> {itemLocationName}</Typography>
        </Grid>
      </Grid>
      {expanded ? (
        <ExpandedAssetDisplay
          locationID={locationID}
          assets={assets}
          assetLocations={assetLocations}
          topLevelAssets={topLevelAssets}
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
}) {
  assets.sort((a, b) => {
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
      {assets.map((asset) => {
        return (
          <AssetEntry_Selector
            key={locationID}
            assetObject={asset}
            assetLocations={assetLocations}
            topLevelAssets={topLevelAssets}
          />
        );
      })}
    </>
  );
}
