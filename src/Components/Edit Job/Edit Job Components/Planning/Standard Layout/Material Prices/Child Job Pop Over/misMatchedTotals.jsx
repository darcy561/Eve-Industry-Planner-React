import { Grid, Typography } from "@mui/material";

export function DisplayMismatchedChildTotals_ChildJobPopoverFrame({
  material,
  childJobObjects,
  jobDisplay,
  childJobProductionCosts,
}) {
  if (
    material.quantity !==
    childJobObjects[jobDisplay].build.products.totalQuantity
  ) {
    return (
      <Grid container sx={{ marginTop: "20px" }}>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Items Produced By Child Job{" "}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {childJobObjects[jobDisplay].build.products.totalQuantity}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>  
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Estimated Cost
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {(
                childJobProductionCosts.finalCostPerItem *
                childJobObjects[jobDisplay].build.products.totalQuantity
              ).toLocaleString(undefined, {
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
