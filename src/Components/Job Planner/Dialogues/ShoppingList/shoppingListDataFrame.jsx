import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../Context/defaultValues";
import uuid from "react-uuid";
import { ShoppingListItem_ShoppingListDialog } from "./shoppingListItem";

export function ListDataFrame_ShoppingListDialog({
  loadingData,
  displayData,
  removeAssets,
}) {
  if (loadingData) return null;
  return displayData.length > 0 ? (
    <ListItems displayData={displayData} removeAssets={removeAssets} />
  ) : (
    <EmptyList />
  );
}

function ListItems({ displayData, removeAssets }) {
  return (
    <Grid container>
      {displayData.map((item) => {
        return (
          <ShoppingListItem_ShoppingListDialog
            key={uuid()}
            item={item}
            removeAssets={removeAssets}
          />
        );
      })}
    </Grid>
  );
}

function EmptyList() {
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography align="center" sx={{ typography: STANDARD_TEXT_FORMAT }}>
          No Items Required
        </Typography>
      </Grid>
    </Grid>
  );
}
