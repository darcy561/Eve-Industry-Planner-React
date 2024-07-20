import { Grid, Typography } from "@mui/material";
import { SMALL_TEXT_FORMAT } from "../../../../../../../Context/defaultValues";

export function DisplayMismatchedChildTotals_ChildJobPopoverFrame({
  materialQuantity,
  totalItemsProduced,
  totalCostPerItem,
}) {
  if (materialQuantity !== totalItemsProduced) {
    return (
      <Grid container sx={{ marginTop: "20px" }}>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
              Total Items Produced By Child Job{" "}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
              {totalItemsProduced.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
              Total Estimated Cost
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
              {totalCostPerItem.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}
