import { Avatar, Box, Grid, Typography } from "@mui/material";
import fullItemList from "../../../../../../../RawData/fullItemList.json";
import { useAssetHelperHooks } from "../../../../../../../Hooks/AssetHooks/useAssetHelper";

export function AssetTemplate_AssetDialogWindow({ assetObject, useCorporationAssets }) {
  const { findAssetImageURL } = useAssetHelperHooks();

  if (!assetObject) return null;

  const itemName =
    fullItemList[assetObject.type_id]?.name ||
    `Unkown Item-${assetObject.type_id}`;

  const imageURL = findAssetImageURL(assetObject);

  return (
    <Grid container item xs={2}>
      <Grid item xs={12}>
        <Box
          height="100%"
          display="flex"
          justifyContent="left"
          alignItems="center"
        >
          <Avatar src={imageURL} alt={itemName} variant="square" />
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="caption">
          {assetObject.quantity.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
