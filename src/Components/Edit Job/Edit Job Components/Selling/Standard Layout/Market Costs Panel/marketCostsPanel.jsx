import { Grid, Paper, Tooltip, Typography } from "@mui/material";
import GLOBAL_CONFIG from "../../../../../../global-config-app";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function MarketCostsPanel({ activeJob }) {
  const { findItemPriceObject } = useHelperFunction();

  const { MARKET_OPTIONS } = GLOBAL_CONFIG;
  const itemCosts = findItemPriceObject(activeJob.itemID);

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary" align="center">
            Current Market Prices
          </Typography>
        </Grid>

        {MARKET_OPTIONS.map(({ id, name }) => {
          const optionCosts = itemCosts[id];
          return (
            <Tooltip
              key={id}
              title={
                <span>
                  <p>
                    <b>30 Day Region Market History</b>
                  </p>
                  <p>
                    Highest Market Price:{" "}
                    {optionCosts.highestMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Lowest Market Price:{" "}
                    {optionCosts.lowestMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Market Price:{" "}
                    {optionCosts.dailyAverageMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Order Quantity:{" "}
                    {optionCosts.dailyAverageOrderQuantity.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Unit Count:{" "}
                    {optionCosts.dailyAverageUnitCount.toLocaleString()}
                  </p>
                </span>
              }
              arrow
              placement="top"
            >
              <Grid container item xs={12} sm={6} md={4} align="center">
                <Grid item xs={12} sm={2}>
                  <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
                    {name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={10}>
                  <Typography
                    sx={{ typography: { xs: "caption", lg: "body1" } }}
                  >
                    Sell:{" "}
                    {itemCosts
                      ? optionCosts.sell.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : 0}
                  </Typography>
                  <Typography
                    sx={{ typography: { xs: "caption", lg: "body1" } }}
                  >
                    Buy:{" "}
                    {itemCosts
                      ? optionCosts.buy.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : 0}
                  </Typography>
                </Grid>
              </Grid>
            </Tooltip>
          );
        })}
      </Grid>
    </Paper>
  );
}
