import { Grid, Paper, Tooltip, Typography } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function BuildStats({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);

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
          <Grid item xs={8}>
            <Typography variant="body1">Total Items Built:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {activeJob.build.products.totalQuantity.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{marginBottom: "20px"}}>
          <Grid item xs={8}>
            <Typography variant="body1">Cost per item:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {(
                Math.round(
                  ((activeJob.build.costs.extrasTotal +
                    activeJob.build.costs.installCosts +
                    activeJob.build.costs.totalPurchaseCost) /
                    activeJob.build.products.totalQuantity +
                    Number.EPSILON) *
                    100
                ) / 100
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={8}>
            <Typography variant="body1">Total Material Cost:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {activeJob.build.costs.totalPurchaseCost.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={8}>
            <Tooltip title="Calculated from linked jobs only, add any unlinked jobs manually as an extra.">
              <Typography variant="body1">Total Install Costs:</Typography>
            </Tooltip>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {activeJob.build.costs.installCosts.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body1">Total Extras:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {activeJob.build.costs.extrasTotal.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={8}>
            <Typography variant="body1">Total Build Cost:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {(
                activeJob.build.costs.totalPurchaseCost +
                activeJob.build.costs.installCosts +
                activeJob.build.costs.extrasTotal
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
