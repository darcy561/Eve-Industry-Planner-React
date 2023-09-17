import { useContext, useState } from "react";
import { EvePricesContext } from "../../../../../../Context/EveDataContext";
import { UsersContext } from "../../../../../../Context/AuthContext";
import GLOBAL_CONFIG from "../../../../../../global-config-app";
import { Grid, MenuItem, Paper, Select, Typography } from "@mui/material";
import { listingType } from "../../../../../../Context/defaultValues";
import { CurrentMaterialHeader } from "./currentMaterialHeader";
import { MaterialCostRow_MaterialPricePanel } from "./itemRow";
import { MaterialTotals_MaterialPricesPanel } from "./materialTotals";

export function MaterialCostPanel({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  setupToEdit,
}) {
  const { evePrices } = useContext(EvePricesContext);
  const { users } = useContext(UsersContext);
  const parentUser = users.find((i) => i.ParentUser);
  const [marketSelect, updateMarketSelect] = useState(
    parentUser.settings.editJob.defaultMarket
  );
  const [listingSelect, updateListingSelect] = useState(
    parentUser.settings.editJob.defaultOrders
  );
  const { MARKET_OPTIONS } = GLOBAL_CONFIG;

  let totalMaterialCost = 0;
  let activeJobPrices = evePrices.find((i) => i.typeID === activeJob.itemID);

  return (
    <Paper
      elevation={3}
      square
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
      </Grid>
      <CurrentMaterialHeader
        activeJob={activeJob}
        activeJobPrices={activeJobPrices}
        marketSelect={marketSelect}
        listingSelect={listingSelect}
      />
      <Grid container item xs={12}>
        {activeJob.build.materials.map((material, materialIndex) => {
          const materialPrice = evePrices.find(
            (i) => i.typeID === material.typeID
          );
          totalMaterialCost +=
            materialPrice[marketSelect][listingSelect] * material.quantity;
          return (
            <MaterialCostRow_MaterialPricePanel
              key={material.typeID}
              activeJob={activeJob}
              updateActiveJob={updateActiveJob}
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
        <MaterialTotals_MaterialPricesPanel
          activeJob={activeJob}
          totalMaterialCost={totalMaterialCost}
          listingSelect={listingSelect}
        />
      </Grid>
    </Paper>
  );
}
