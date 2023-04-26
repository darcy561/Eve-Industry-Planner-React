import { Grid, Typography } from "@mui/material";

export default function GroupStep4JobCard({ job }) {

  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        <Grid item xs={6}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Items Built
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography
            sx={{ typography: { xs: "body2", md: "body1" } }}
            align="right"
          >
            {job.build.products.totalQuantity.toLocaleString()}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Item Cost
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography
            sx={{ typography: { xs: "body2", md: "body1" } }}
            align="right"
          >
            {(
              Math.round(
                ((job.build.costs.extrasTotal +
                  job.build.costs.installCosts +
                  job.build.costs.totalPurchaseCost) /
                  job.build.products.totalQuantity +
                  Number.EPSILON) *
                  100
              ) / 100
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
