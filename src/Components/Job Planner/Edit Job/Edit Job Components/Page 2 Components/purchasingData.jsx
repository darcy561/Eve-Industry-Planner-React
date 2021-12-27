import { FormControlLabel, Grid, Paper, Switch, Typography } from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function PurchasingData({ hideItems, updateHideItems }) {
  const { activeJob } = useContext(ActiveJobContext);

  let totalComplete = 0;

  activeJob.build.materials.forEach((material) => {
    if (material.quantityPurchased >= material.quantity) {
      totalComplete++;
    }
  });

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          padding: "20px",
        }}
        elevation={3}
        square={true}
      >
        <Grid container direction="row">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1">
              Total Complete Items: {totalComplete} /{" "}
              {activeJob.build.materials.length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1">
              Total Material Cost:{" "}
              {activeJob.build.costs.totalPurchaseCost.toLocaleString()} ISK
            </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                  <FormControlLabel control={<Switch onChange={()=>updateHideItems(!hideItems)} />} label="Hide Completed Purchases" />
                  </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
