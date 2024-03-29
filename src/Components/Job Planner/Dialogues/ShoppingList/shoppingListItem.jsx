import { Avatar, Grid, Typography } from "@mui/material";
import { LARGE_TEXT_FORMAT } from "../../../../Context/defaultValues";

export function ShoppingListItem_ShoppingListDialog({ item, removeAssets }) {
  const { typeID, name } = item;
  const assetQuantityText = removeAssets
    ? item.quantityLessAsset.toLocaleString()
    : item.quantity.toLocaleString();
  return (
    <Grid
      container
      item
      xs={12}
      justifyContent="center"
      alignItems="center"
      sx={{ marginBottom: { xs: "1px", sm: "0px" } }}
    >
      <Grid
        item
        sm={1}
        sx={{
          display: { xs: "none", sm: "block" },
          paddingRight: "5px",
        }}
        align="center"
      >
        <Avatar
          src={`https://images.evetech.net/types/${typeID}/icon?size=32`}
          alt={name}
          variant="square"
          sx={{ height: 32, width: 32 }}
        />
      </Grid>
      <Grid item xs={8} sm={7}>
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>{name}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography sx={{ typography: LARGE_TEXT_FORMAT }} align="right">
          {assetQuantityText}
        </Typography>
      </Grid>
    </Grid>
  );
}
