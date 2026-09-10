import { Typography, Grid } from "@mui/material";
import { formatNumberForLocale } from "../../../../../../Functions/Helper/numberParser";
import ContentPanel from "../../../../../../Styled Components/Paper/ContentPanel";
import { STANDARD_TEXT_FORMAT } from "../../../../../../Context/defaultValues";

export function SalesStats({ state }) {
  const brokersFeesTotal = state.activeJob.totalBrokersFees;
  const transactionFeeTotal = state.activeJob.totalTransactionFees;
  // Orders that have not sold yet carry the estimate made when they were linked.
  // Stated separately because it is a forecast, and mixing it into the charged
  // total would read as money already taken.
  const estimatedTaxOutstanding =
    state.activeJob.estimatedSalesTaxOutstanding;
  const totalSale = state.activeJob.totalSales;

  return (
    <ContentPanel componentName="Sales Stats Panel">
      <Grid container spacing={1}>
        <Grid container size={12}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Items Built:
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(
                state.activeJob.totalQuantityProduced,
                { max: 0 },
              )}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Build Cost:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(state.activeJob.buildCost)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Broker Fees:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(brokersFeesTotal)}
            </Typography>
          </Grid>
        </Grid>
        {estimatedTaxOutstanding > 0 ? (
          <Grid container size={12}>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                Estimated Tax On Unsold Orders:
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography
                sx={{ typography: STANDARD_TEXT_FORMAT }}
                align="right"
                color="text.secondary"
              >
                {formatNumberForLocale(estimatedTaxOutstanding)}
              </Typography>
            </Grid>
          </Grid>
        ) : null}
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Transaction Fees:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(transactionFeeTotal)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Job Cost:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(state.activeJob.totalCost)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container sx={{ marginBottom: 1 }} size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Cost Per Item:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(state.activeJob.totalCostPerItem())}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Total Sales:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(totalSale)}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Average Sale Price Per Item:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
              {formatNumberForLocale(state.activeJob.averageItemSalePrice())}
            </Typography>
          </Grid>
        </Grid>
        <Grid container size={12}>
          <Grid
            size={{
              xs: 12,
              sm: 8,
            }}
          >
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Profit/Loss:
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 4,
            }}
          >
            <Typography
              sx={{ typography: STANDARD_TEXT_FORMAT }}
              align="right"
              color={
                totalSale - state.activeJob.totalCost < 0
                  ? "error"
                  : "primary"
              }
            >
              {formatNumberForLocale(totalSale - state.activeJob.totalCost)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </ContentPanel>
  );
}
