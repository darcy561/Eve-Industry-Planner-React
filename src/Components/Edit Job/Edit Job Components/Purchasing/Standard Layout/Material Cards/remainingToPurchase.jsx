import { Grid, Typography } from "@mui/material";
import {
  STANDARD_TEXT_FORMAT,
  ZERO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function RemainingToPurchase_Purchasing({
  material,
  childJobProductionTotal,
}) {
  if (childJobProductionTotal >= material.quantity) return null;

  return (
    <Grid item xs={12}>
      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
        Remaining To Purchase:{" "}
        {(material.quantity - material.quantityPurchased).toLocaleString(
          undefined,
          ZERO_DECIMAL_PLACES
        )}
      </Typography>
    </Grid>
  );
}
