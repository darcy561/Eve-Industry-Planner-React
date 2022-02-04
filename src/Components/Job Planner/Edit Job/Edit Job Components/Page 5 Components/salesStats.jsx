import { Grid, Paper, Typography } from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function SalesStats() {
  const { activeJob } = useContext(ActiveJobContext);

  let brokersFeesTotal = 0;
  activeJob.build.sale.brokersFee.forEach(
    (item) => (brokersFeesTotal += item.amount)
  );
  let transactionFeeTotal = 0;
  let totalSale = 0;
  activeJob.build.sale.transactions.forEach((item) => {
    transactionFeeTotal += item.tax;
    totalSale += item.amount;
  });

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Total Build Cost:</Typography>
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
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Brokers Fee Total:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {brokersFeesTotal.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Transaction Fee Total:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {transactionFeeTotal.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Total Job Cost:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {(
                activeJob.build.costs.totalPurchaseCost +
                activeJob.build.costs.installCosts +
                activeJob.build.costs.extrasTotal +
                brokersFeesTotal +
                transactionFeeTotal
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Total Cost Per Item:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {(
                Math.round(
                  ((activeJob.build.costs.totalPurchaseCost +
                    activeJob.build.costs.installCosts +
                    activeJob.build.costs.extrasTotal +
                    brokersFeesTotal +
                    transactionFeeTotal) /
                    activeJob.build.products.totalQuantity +
                    Number.EPSILON) *
                    100
                ) / 100
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">Total Of Sales:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {totalSale.toLocaleString()} ISK
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={8}>
            <Typography variant="body2">
              Average Sale Price Per Item:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right">
              {(
                Math.round(
                  (totalSale / activeJob.build.products.totalQuantity +
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
            <Typography variant="body2">Profit/Loss:</Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body1" align="right"color={(
                totalSale -
                (activeJob.build.costs.totalPurchaseCost +
                  activeJob.build.costs.installCosts +
                  activeJob.build.costs.extrasTotal +
                  brokersFeesTotal +
                  transactionFeeTotal)
              ) < 0 ? "error": "primary"}>
              {(
                totalSale -
                (activeJob.build.costs.totalPurchaseCost +
                  activeJob.build.costs.installCosts +
                  activeJob.build.costs.extrasTotal +
                  brokersFeesTotal +
                  transactionFeeTotal)
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
