import { Grid, Typography } from "@mui/material";
import { TWO_DECIMAL_PLACES } from "../../../../../../../Context/defaultValues";

export function MaterialTotalsWithChildJobs_MaterialPrices({
  childJobCount,
  totalBuildCost,
  totalInstallCosts,
  totalMarketPrice,
  totalMaterialCost,
  activeJob,
}) {
  const totalPrice = totalBuildCost + totalInstallCosts;

  const displayChildJobData = childJobCount > 0 ? "block" : "none";
  const textStyle = { xs: "caption", sm: "body2" };
  const displayColor = getDisplayColor();

  function getDisplayColor() {
    if (totalPrice < totalMarketPrice) {
      return totalPrice > totalMaterialCost + totalInstallCosts
        ? "orange"
        : "success.main";
    } else {
      return "error.main";
    }
  }

  return (
    <Grid container item xs={12} sx={{ display: displayChildJobData }}>
      <Grid item xs={12}>
        <Typography sx={{ typography: textStyle }}>
          Total Estimated Material Price With Child Jobs
        </Typography>
        <Typography sx={{ typography: textStyle }}>
          {totalBuildCost.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>
          Total Install Costs
        </Typography>
        <Typography sx={{ typography: textStyle }}>
          {totalInstallCosts.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>
          Total Estimated Cost With Child Jobs
        </Typography>
        <Typography sx={{ typography: textStyle, color: displayColor }}>
          {totalPrice.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>
          Total Estimated Price Per Item With Child Jobs
        </Typography>
        <Typography sx={{ typography: textStyle, color: displayColor }}>
          {(totalPrice / activeJob.build.products.totalQuantity).toLocaleString(
            undefined,
            TWO_DECIMAL_PLACES
          )}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>Profit/Loss</Typography>
        <Typography
          sx={{ typography: textStyle, color: displayColor }}
        >
          {(totalMarketPrice - totalPrice).toLocaleString(
            undefined,
            TWO_DECIMAL_PLACES
          )}
        </Typography>
      </Grid>
    </Grid>
  );
}
