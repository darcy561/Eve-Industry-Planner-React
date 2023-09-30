import { Grid, Paper, Tooltip, Typography } from "@mui/material";

export function BuildStatsPanel({ activeJob }) {
  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Material Cost:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {activeJob.build.costs.totalPurchaseCost.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Tooltip title="Calculated from linked jobs only, add any unlinked jobs manually as an extra.">
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Install Costs:
              </Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {activeJob.build.costs.installCosts.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Extras:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {activeJob.build.costs.extrasTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Build Cost:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {(
                activeJob.build.costs.totalPurchaseCost +
                activeJob.build.costs.installCosts +
                activeJob.build.costs.extrasTotal
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Items Built:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {activeJob.build.products.totalQuantity.toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }
              )}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Cost per item:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {(
                Math.round(
                  ((activeJob.build.costs.extrasTotal +
                    activeJob.build.costs.installCosts +
                    activeJob.build.costs.totalPurchaseCost) /
                    activeJob.build.products.totalQuantity +
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
    </Paper>
  );
}
