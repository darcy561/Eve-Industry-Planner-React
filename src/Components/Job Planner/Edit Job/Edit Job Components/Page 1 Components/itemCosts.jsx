import {
  Grid,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ItemCostRow } from "./itemCostRow";
import { listingType } from "../../../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../../../global-config-app";
import { useInstallCostsCalc } from "../../../../../Hooks/GeneralHooks/useInstallCostCalc";

export function ItemCostPanel({ jobModified, setJobModified }) {
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
  const { calculateInstallCostFromJob } = useInstallCostsCalc();
  const { MARKET_OPTIONS } = GLOBAL_CONFIG;

  let totalJobBuy = 0;

  let activeJobPrices = evePrices.find((i) => i.typeID === activeJob.itemID);

  let totalJobSell = 0;
  console.log(calculateInstallCostFromJob(activeJob));
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
          sx={{ marginBottom: { xs: "50px", sm: "20px", lg: "40px" } }}
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
          {MARKET_OPTIONS.map((option) => {
            return (
              <MenuItem key={option.name} value={option.id}>
                {option.name}
              </MenuItem>
            );
          })}
        </Select>
        <Grid container item xs={12}>
          <Grid
            item
            md={1}
            sx={{
              display: { xs: "none", md: "block" },
              paddingRight: "5px",
            }}
            align="center"
          >
            <img
              src={`https://images.evetech.net/types/${activeJob.itemID}/icon?size=32`}
              alt=""
            />
          </Grid>
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
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Item Sell Price:
            </Typography>
            <Tooltip
              title={
                <span>
                  <p>
                    <b>30 Day Region Market History</b>
                  </p>
                  <p>
                    Highest Market Price:{" "}
                    {activeJobPrices[
                      marketSelect
                    ].highestMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Lowest Market Price:{" "}
                    {activeJobPrices[
                      marketSelect
                    ].lowestMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Market Price:{" "}
                    {activeJobPrices[
                      marketSelect
                    ].dailyAverageMarketPrice.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Order Quantity:{" "}
                    {activeJobPrices[
                      marketSelect
                    ].dailyAverageOrderQuantity.toLocaleString()}
                  </p>
                  <p>
                    Daily Average Unit Count:{" "}
                    {activeJobPrices[
                      marketSelect
                    ].dailyAverageUnitCount.toLocaleString()}
                  </p>
                </span>
              }
              arrow
              placement="top"
            >
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                {activeJobPrices !== undefined
                  ? activeJobPrices[marketSelect].sell.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )
                  : 0}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            item
            xs={6}
            md={4}
            align="center"
            sx={{ marginTop: { xs: "10px", md: "0px" } }}
          >
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Sell Price:
            </Typography>

            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {activeJobPrices !== undefined
                ? (
                    activeJobPrices[marketSelect].sell *
                    activeJob.build.products.totalQuantity
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : 0}
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
              <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
                Item Price
              </Typography>
            </Grid>
            <Grid item xs={6} md={4} align="center">
              <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
                Total Price
              </Typography>
            </Grid>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          {activeJob.build.materials.map((material, materialIndex) => {
            const materialPrice = evePrices.find(
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
                jobModified={jobModified}
                setJobModified={setJobModified}
                materialIndex={materialIndex}
              />
            );
          })}
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid item xs={12} sm={6} align="center">
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Material Sell Price Per Item
              </Typography>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                {(
                  totalJobSell / activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography
                sx={{
                  marginTop: "5px",
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                Total Material Buy Price Per Item
              </Typography>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
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
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Material Sell Price
              </Typography>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                {totalJobSell.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
              <Typography
                sx={{
                  marginTop: "5px",
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                Total Material Buy Price:
              </Typography>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
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
