import { Grid, Typography } from "@mui/material";
import {
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../Context/defaultValues";

export default function GroupStep4JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Items Built
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.build.products.totalQuantity.toLocaleString()}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Item Cost
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {(
              Math.round(
                ((job.build.costs.extrasTotal +
                  job.build.costs.installCosts +
                  job.build.costs.totalPurchaseCost) /
                  job.build.products.totalQuantity +
                  Number.EPSILON) *
                  100
              ) / 100
            ).toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
