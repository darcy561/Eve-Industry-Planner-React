import { useContext } from "react";
import { EvePricesContext } from "../../../../../../../Context/EveDataContext";
import { Grid, Typography } from "@mui/material";

export function ChildJobMaterials_ChildJobPopoverFrame({
  jobDisplay,
  childJobObjects,
  tempPrices,
  marketSelect,
  listingSelect,
}) {
  const { evePrices } = useContext(EvePricesContext);

  return childJobObjects[jobDisplay].build.materials.map(
    ({ name, typeID, quantity }) => {
      const materialPrice =
        evePrices.find((i) => i.typeID === typeID) ||
        tempPrices.find((i) => i.typeID === typeID);

      return (
        <Grid key={typeID} container item xs={12}>
          <Grid item xs={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {name}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              {!materialPrice
                ? 0
                : (
                    materialPrice[marketSelect][listingSelect] * quantity
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </Typography>
          </Grid>
        </Grid>
      );
    }
  );
}
