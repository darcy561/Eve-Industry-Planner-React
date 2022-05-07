import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function MarketCostsPanel() {
  const { activeJob } = useContext(ActiveJobContext);
  const { evePrices } = useContext(EvePricesContext);

  let itemCosts = evePrices.find((i) => i.typeID === activeJob.itemID);

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
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary" align="center">
            Current Market Prices
          </Typography>
        </Grid>
        <Grid container item xs={12} sm={6} md={4} align="center">
          <Grid item xs={12} sm={2}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Amarr
            </Typography>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Sell:{" "}
              {itemCosts.amarr.sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Buy:{" "}
              {itemCosts.amarr.buy.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          container
          item
          xs={12}
          sm={6}
          md={4}
          align="center"
          sx={{ marginTop: { xs: "10px", sm: "0px" } }}
        >
          <Grid item xs={12} sm={2}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Dodixie
            </Typography>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Sell:{" "}
              {itemCosts.dodixie.sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Buy:{" "}
              {itemCosts.dodixie.buy.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
        <Grid
          container
          item
          xs={12}
          sm={6}
          md={4}
          align="center"
          sx={{ marginTop: { xs: "10px", md: "0px" } }}
        >
          <Grid item xs={12} sm={2}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Jita
            </Typography>
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Sell:{" "}
              {itemCosts.jita.sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
            <Typography sx={{ typography: { xs: "body2", lg: "body1" } }}>
              Buy:{" "}
              {itemCosts.jita.buy.toLocaleString(undefined, {
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
