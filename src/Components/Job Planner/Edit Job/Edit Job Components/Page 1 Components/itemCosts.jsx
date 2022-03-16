import {
  Grid,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function ItemCostPanel() {
  const { activeJob } = useContext(ActiveJobContext);
  const { evePrices } = useContext(EvePricesContext);
  const [marketSelect, updateMarketSelect] = useState("jita");
  const marketOptions = [
    { id: "amarr", name: "Amarr" },
    { id: "dodixie", name: "Dodixie" },
    { id: "jita", name: "Jita" },
  ];
  const [marketOption, updateMarketOption] = useState(marketOptions[2]);

  let activeJobPrices = evePrices.find((i) => i.typeID === activeJob.itemID);

  let totalJobBuy = 0;
  let totalJobSell = 0;

  return (
    <Paper
      elevation={3}
      square={true}
      sx={{ minWidth: "100%", padding: "20px", position: "relative" }}
    >
      <Grid container>
        <Grid
          item
          xs={12}
          align="center"
          sx={{ marginBottom: { xs: "40px", sm: "20px" } }}
        >
          <Typography variant="h6" color="primary">
            Estimated Market Costs
          </Typography>
        </Grid>
        <Select
          value={marketOption}
          renderValue={(entry) => {
            return entry.name;
          }}
          variant="standard"
          size="small"
          onChange={(e) => {
            updateMarketSelect(e.target.value.id);
            updateMarketOption(e.target.value);
          }}
          sx={{
            width: "90px",
            position: "absolute",
            top: { xs: "50px", sm: "20px" },
            right: { xs: "35%", sm: "30px" },
          }}
        >
          {marketOptions.map((option) => {
            return (
              <MenuItem key={option.id} value={option}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
        <Grid container item xs={12}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2">{activeJob.name}</Typography>
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            align="right"
            sx={{ marginTop: { xs: "10px", md: "0px" } }}
          >
            <Typography variant="body2">
              Unit Sell Price:{" "}
              {activeJobPrices[marketSelect].sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
            </Typography>
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            align="right"
            sx={{ marginTop: { xs: "10px", md: "0px" } }}
          >
            <Typography variant="body2">
              Total Sell Price:{" "}
              {(
                activeJobPrices[marketSelect].sell *
                activeJob.build.products.totalQuantity
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: {xs:"10px", sm:"20px"} }}>
          {activeJob.build.materials.map((material) => {
            let materialPrice = evePrices.find(
              (i) => i.typeID === material.typeID
            );
            totalJobBuy += materialPrice[marketSelect].buy * material.quantity;
            totalJobSell +=
              materialPrice[marketSelect].sell * material.quantity;
            return (
              <Grid
                key={material.typeID}
                container
                item
                xs={12}
                sx={{ padding:{xs:"7px 0px", sm:"10px 0px"}}}
              >
                <Grid item xs={12} md={4} align="left">
                  <Typography variant="body2"> {material.name}</Typography>
                </Grid>
                <Grid
                  item
                  xs={6}
                  md={4}
                  align="right"
                  sx={{ marginTop: { xs: "10px", md: "0px" } }}
                >
                  <Typography variant="body2">
                    Unit Sell Price:{" "}
                    {materialPrice[marketSelect].sell.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}{" "}
                  </Typography>
                  <Typography variant="body2">
                    Unit Buy Price:{" "}
                    {materialPrice[marketSelect].buy.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
                <Grid
                  item
                  xs={6}
                  md={4}
                  align="right"
                  sx={{ marginTop: { xs: "10px", md: "0px" } }}
                >
                  <Typography variant="body2">
                    Total Sell Price:{" "}
                    {(
                      materialPrice[marketSelect].sell * material.quantity
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                  <Typography variant="body2">
                    Total Buy Price:{" "}
                    {(
                      materialPrice[marketSelect].buy * material.quantity
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid item xs={12} sm={6} align="center">
              <Typography variant="body2">
                Total Material Sell Price Per Item:{" "}
                {(
                  totalJobSell / activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2">
                Total Material Buy Price Per Item:{" "}
                {(
                  totalJobBuy / activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} align="center" sx={{marginTop:{xs:"10px", sm:"0px"}}}>
              <Typography variant="body2">
                Total Material Sell Price:{" "}
                {totalJobSell.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2">
                Total Material Buy Price:{" "}
                {totalJobBuy.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
