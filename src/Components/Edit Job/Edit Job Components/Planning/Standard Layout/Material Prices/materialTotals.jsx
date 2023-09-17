import { Grid, Typography } from "@mui/material";

export function MaterialTotals_MaterialPricesPanel({
  activeJob,
  totalMaterialCost,
  listingSelect,
}) {
  const formatedMarketTitle =
    listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1);
  const totalInstallCosts = Object.values(activeJob.build.setup).reduce(
    (prev, setup) => {
      return (prev += setup.estimatedInstallCost * setup.jobCount);
    },
    0
  );
  return (
    <Grid container item xs={12} sx={{ marginTop: "20px" }}>
      <Grid item xs={12} sm={6} align="center">
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Total Material ${formatedMarketTitle} Price Per Item`}
        </Typography>
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {(
            totalMaterialCost / activeJob.build.products.totalQuantity
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
      <Grid
        item
        xs={12}
        sm={6}
        align="center"
        sx={{ marginTop: { xs: "10px", sm: "0px" } }}
      >
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Total Material ${formatedMarketTitle} Price`}
        </Typography>
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {totalMaterialCost.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} sx={{ marginTop: { xs: "10px", sm: "0px" } }} />
      <Grid
        item
        align="center"
        xs={12}
        sm={6}
        sx={{ marginTop: { xs: "10px", sm: "0px" } }}
      >
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Total Install Costs`}
        </Typography>
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {totalInstallCosts.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} sx={{ marginTop: { xs: "10px", sm: "0px" } }} />
      <Grid
        item
        align="center"
        xs={12}
        sm={6}
        sx={{ marginTop: { xs: "10px", sm: "0px" } }}
      >
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {`Total Costs`}
        </Typography>
        <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
          {(totalMaterialCost + totalInstallCosts).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Typography>
      </Grid>
    </Grid>
  );
}
