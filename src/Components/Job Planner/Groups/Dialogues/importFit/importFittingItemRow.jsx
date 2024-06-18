import { Avatar, Checkbox, Grid, Typography } from "@mui/material";

export function ImportFittingItemRow({ updateImportedItemList, item, index }) {
  if (!item.buildable) return null;
  return (
    <Grid container item xs={12}>
      <Grid
        container
        item
        xs={2}
        sm={1}
        alignItems="center"
        justifyContent="center"
      >
        <Avatar
          src={`https://images.evetech.net/types/${item.itemID}/icon?size=32`}
          alt={item.itemName}
          variant="square"
          sx={{ height: 32, width: 32 }}
        />
      </Grid>
      <Grid container item xs={7} sm={8} alignItems="center">
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {item.itemName}
        </Typography>
      </Grid>
      <Grid container item xs={2} justifyContent="center" alignItems="center">
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {item.itemCalculatedQty.toLocaleString()}
        </Typography>
      </Grid>
      <Grid item xs={1}>
        <Checkbox
          checked={item.included}
          onChange={() => {
            updateImportedItemList((prev) => {
              const newList = [...prev];
              newList[index].included = !newList[index].included;
              return newList;
            });
          }}
        />
      </Grid>
    </Grid>
  );
}
