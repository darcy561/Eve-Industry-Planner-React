import { Grid, Paper, Typography } from "@mui/material";
import {
  LARGE_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function InformationPanel({ activeJob }) {
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square
    >
      <Grid container>
        <Grid
          item
          xs={12}
          sm={4}
          align="center"
          sx={{ marginTop: { xs: "5px", sm: "0px" } }}
        >
          <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
            Total Material Cost:{" "}
            {activeJob.build.costs.totalPurchaseCost.toLocaleString(
              undefined,
              TWO_DECIMAL_PLACES
            )}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          align="center"
          sx={{ marginTop: { xs: "5px", lg: "0px" } }}
        >
          <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
            Total Install Costs:{" "}
            {activeJob.build.costs.installCosts.toLocaleString(
              undefined,
              TWO_DECIMAL_PLACES
            )}
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          align="center"
          sx={{ marginTop: { xs: "5px", lg: "0px" } }}
        >
          <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
            Total Cost Per Item:{" "}
            {(
              (activeJob.build.costs.totalPurchaseCost +
                activeJob.build.costs.installCosts) /
              activeJob.build.products.totalQuantity
            ).toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
