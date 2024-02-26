import { Grid, Typography } from "@mui/material";
import {
  STANDARD_TEXT_FORMAT,
  ZERO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function ChildJobProductionTotal_Purchasing({
  childJobLocation,
  childJobProductionTotal,
}) {
  if (childJobLocation.length !== 0) return null;

  return (
    <Grid item xs={12}>
      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
        {childJobLocation.length > 1
          ? "Child Jobs Production Total:"
          : "Child Job Production Total: "}
        {childJobProductionTotal.toLocaleString(undefined, ZERO_DECIMAL_PLACES)}
      </Typography>
    </Grid>
  );
}
