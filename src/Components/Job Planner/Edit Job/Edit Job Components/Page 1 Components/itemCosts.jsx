import { Grid, MenuItem, Paper, Select, Typography } from "@mui/material";
import { useContext, useState } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ItemCostRow } from "./itemCostRow";
import {
  listingType,
  marketOptions,
} from "../../../../../Context/defaultValues";

export function ItemCostPanel() {
  const { activeJob } = useContext(ActiveJobContext);
  const { evePrices } = useContext(EvePricesContext);
  const { users } = useContext(UsersContext);
  const parentUser = users.find((i) => i.ParentUser);
  const [marketSelect, updateMarketSelect] = useState(
    parentUser.settings.editJob.defaultMarket
  );
  const [listingSelect, updateListingSelect] = useState(
    parentUser.settings.editJob.defaultOrders
  );

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
          sx={{ marginBottom: { xs: "50px", sm: "20px" } }}
        >
          <Typography variant="h6" color="primary">
            Estimated Market Costs
          </Typography>
        </Grid>
        <Select
          value={listingSelect}
          variant="standard"
          size="small"
          onChange={(e) => {
            updateListingSelect(e.target.value);
          }}
          sx={{
            width: "120px",
            position: "absolute",
            top: { xs: "55px", sm: "20px" },
            left: { xs: "10%", sm: "30px" },
          }}
        >
          {listingType.map((option) => {
            return (
              <MenuItem key={option.name} value={option.id}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
        <Select
          value={marketSelect}
          variant="standard"
          size="small"
          onChange={(e) => {
            updateMarketSelect(e.target.value);
          }}
          sx={{
            width: "90px",
            position: "absolute",
            top: { xs: "55px", sm: "20px" },
            right: { xs: "10%", sm: "30px" },
          }}
        >
          {marketOptions.map((option) => {
            return (
              <MenuItem key={option.name} value={option.id}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
        <Grid container item xs={12}>
          <Grid item md={1} />
          <Grid item xs={12} md={4}>
            <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
              {activeJob.name}
            </Typography>
          </Grid>
          <Grid
            item
            xs={6}
            md={3}
            align="center"
            sx={{ marginTop: { xs: "10px", md: "0px" } }}
          >
            <Typography variant="body2">Unit Sell Price:</Typography>
            <Typography variant="body2">
              {activeJobPrices[marketSelect].sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            align="center"
            sx={{ marginTop: { xs: "10px", md: "0px" } }}
          >
            <Typography variant="body2">Total Sell Price:</Typography>
            <Typography variant="body2">
              {(
                activeJobPrices[marketSelect].sell *
                activeJob.build.products.totalQuantity
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sx={{
              marginTop: { xs: "30px", sm: "30px" },
              marginBottom: { xs: "10px" },
            }}
          >
            <Grid item md={5} sx={{ marginTop: { xs: "10px", sm: "20px" } }} />
            <Grid item xs={6} md={3} align="center">
              <Typography variant="body1">Unit Price</Typography>
            </Grid>
            <Grid item xs={6} md={4} align="center">
              <Typography variant="body1">Total Price</Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          {activeJob.build.materials.map((material) => {
            let materialPrice = evePrices.find(
              (i) => i.typeID === material.typeID
            );
            totalJobBuy += materialPrice[marketSelect].buy * material.quantity;
            totalJobSell +=
              materialPrice[marketSelect].sell * material.quantity;
            return (
              <ItemCostRow
                key={material.typeID}
                material={material}
                marketSelect={marketSelect}
                listingSelect={listingSelect}
                materialPrice={materialPrice}
              />
            );
          })}
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid item xs={12} sm={6} align="center">
              <Typography variant="body2">
                Total Material Sell Price Per Item
              </Typography>
              <Typography variant="body2">
                {(
                  totalJobSell / activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2" sx={{ marginTop: "5px" }}>
                Total Material Buy Price Per Item
              </Typography>
              <Typography variant="body2">
                {(
                  totalJobBuy / activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
              align="center"
              sx={{ marginTop: { xs: "10px", sm: "0px" } }}
            >
              <Typography variant="body2">Total Material Sell Price</Typography>
              <Typography variant="body2">
                {totalJobSell.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography variant="body2" sx={{ marginTop: "5px" }}>
                Total Material Buy Price:
              </Typography>
              <Typography variant="body2">
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
