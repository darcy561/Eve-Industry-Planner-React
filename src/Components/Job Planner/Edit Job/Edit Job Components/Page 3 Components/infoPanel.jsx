import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function InformationPanel() {
  const { activeJob } = useContext(ActiveJobContext);
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid container item xs={12} sm={6} lg={3} align="center">
          <Grid item xs={6}>
            <Typography sx={{ typography: { xs: "caption", lg: "body1" } }}>
              Runs: {activeJob.runCount}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ typography: { xs: "caption", lg: "body1" } }}>
              Jobs: {activeJob.jobCount}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          align="center"
          sx={{ marginTop: { xs: "5px", sm: "0px" } }}
        >
          <Typography sx={{ typography: { xs: "caption", lg: "body1" } }}>
            Total Material Cost:{" "}
            {activeJob.build.costs.totalPurchaseCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          align="center"
          sx={{ marginTop: { xs: "5px", lg: "0px" } }}
        >
          <Typography sx={{ typography: { xs: "caption", lg: "body1" } }}>
            Total Install Costs:{" "}
            {activeJob.build.costs.installCosts.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={6}
          lg={3}
          align="center"
          sx={{ marginTop: { xs: "5px", lg: "0px" } }}
        >
          <Typography sx={{ typography: { xs: "caption", lg: "body1" } }}>
            Total Cost Per Item:{" "}
            {(
              (activeJob.build.costs.totalPurchaseCost +
                activeJob.build.costs.installCosts) /
              activeJob.build.products.totalQuantity
            ).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
