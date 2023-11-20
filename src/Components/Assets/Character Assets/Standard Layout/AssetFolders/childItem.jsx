import { Avatar, Grid, Typography } from "@mui/material";
import fullItemList from "../../../../../RawData/fullItemList.json";

export function AssetEntry_Child({
  assetObject,
  assetLocations,
  topLevelAssets,
}) {
  const itemIsWithinContainer = topLevelAssets.has(assetObject.location_id);
  const itemName =
    fullItemList.find((i) => assetObject.type_id === i.type_id)?.name ||
    "Unkown Item";

  const marginDistance = itemIsWithinContainer ? "0px" : "30px";
  return (
    <Grid container item xs={12} sx={{ paddingLeft: marginDistance }}>
      <Grid item xs={1}>
        <Avatar
          src={`https://images.evetech.net/types/${assetObject.type_id}/icon?size=32`}
          alt={itemName}
          variant="square"
          sx={{ height: 32, width: 32 }}
        />
      </Grid>
      <Grid item xs={8}>
        <Typography variant="body2">{itemName}</Typography>
      </Grid>
      <Grid xs={3}>
        <Typography variant="body2" align="right">
          {assetObject.quantity.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
