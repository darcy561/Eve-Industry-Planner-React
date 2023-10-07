import { Grid, Typography } from "@mui/material";

export function ChildJobMaterialTotalCosts_ChildJobPopoverFrame({
  currentMaterialPrice,
  childJobProductionCosts,
}) {
  const colorSelection =
    currentMaterialPrice <= childJobProductionCosts.finalCostPerItem
      ? "error.main"
      : "success.main";

  return (
    <Grid container sx={{ marginTop: "20px" }}>
      <Grid container item xs={12} sx={{ marginTop: "5px" }}>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Total Materials
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {childJobProductionCosts.materialCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Total Install Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {childJobProductionCosts.installCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Total Estimated Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {childJobProductionCosts.finalCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {`Total Price Per Item`}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4} align="right">
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
              color={colorSelection}
            >
              {childJobProductionCosts.finalCostPerItem.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
