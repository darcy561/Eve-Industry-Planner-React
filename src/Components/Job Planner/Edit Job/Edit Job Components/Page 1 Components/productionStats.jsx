import { useContext } from "react";
import { Grid, Paper, Typography } from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function ProductionStats() {
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
      <Grid container direction="column" sx={{}}>
        <Grid container direction="row" item>
          <Grid container item xs={12} sx={{ marginBottom: "5px" }}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Items Produced Per Blueprint Run
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {Number(
                  activeJob.rawData.products[0].quantity
                ).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginBottom: "5px" }}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Items Per Job Slot
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {activeJob.build.products.quantityPerJob.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Items Being Produced
              </Typography>
            </Grid>

            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "caption", sm: "body2" } }}
                align="right"
              >
                {activeJob.build.products.totalQuantity.toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
