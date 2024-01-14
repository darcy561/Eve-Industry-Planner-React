import { Grid, Typography } from "@mui/material";

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
            <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
              Total Items Produced By Child Job{" "}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
              {totalItemsProduced.toLocaleString()} 
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
              Total Estimated Cost
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
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
