import { Grid, Paper, Typography } from "@mui/material";

export function SalesStats({ activeJob }) {
  const brokersFeesTotal = activeJob.build.sale.brokersFee.reduce(
    (prev, item) => {
      return (prev += item.amount);
    },
    0
  );

  const { transactionFeeTotal, totalSale, averageQuantity } =
    activeJob.build.sale.transactions.reduce(
      (prev, item) => {
        return {
          transactionFeeTotal: prev.transactionFeeTotal + item.tax,
          totalSale: prev.totalSale + item.amount,
          averageQuantity: prev.averageQuantity + item.quantity,
        };
      },
      {
        transactionFeeTotal: 0,
        totalSale: 0,
        averageQuantity: 0,
      }
    );

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square
    >
      <Grid container>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
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
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Brokers Fee Total:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {brokersFeesTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Transaction Fee Total:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {transactionFeeTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Job Cost:
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
                activeJob.build.costs.extrasTotal +
                brokersFeesTotal +
                transactionFeeTotal
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Cost Per Item:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
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
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Of Sales:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {totalSale.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Average Sale Price Per Item:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {averageQuantity > 0
                ? (
                    Math.round(
                      (totalSale / averageQuantity + Number.EPSILON) * 100
                    ) / 100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : 0.0}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Profit/Loss:
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
              color={
                totalSale -
                  (activeJob.build.costs.totalPurchaseCost +
                    activeJob.build.costs.installCosts +
                    activeJob.build.costs.extrasTotal +
                    brokersFeesTotal +
                    transactionFeeTotal) <
                0
                  ? "error"
                  : "primary"
              }
            >
              {(
                totalSale -
                (activeJob.build.costs.totalPurchaseCost +
                  activeJob.build.costs.installCosts +
                  activeJob.build.costs.extrasTotal +
                  brokersFeesTotal +
                  transactionFeeTotal)
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
