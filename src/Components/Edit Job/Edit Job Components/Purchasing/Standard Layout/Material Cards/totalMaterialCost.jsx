import { Grid, Typography } from "@mui/material";
import {
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function TotalCost_Purchasing({ material }) {
  return (
    <Grid item xs={12} sx={{ marginBottom: "10px" }}>
      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
        {`Total Cost: 
        ${material.purchasedCost.toLocaleString(undefined, TWO_DECIMAL_PLACES)} 
        ISK`}
      </Typography>
    </Grid>
  );
}
