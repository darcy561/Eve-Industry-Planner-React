import { Grid, Typography } from "@mui/material";
import {
  SMALL_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../../../../Context/defaultValues";

export function ChildJobMaterialTotalCosts_ChildJobPopoverFrame({
  currentMaterialPrice,
  totalCostOfMaterials,
  totalInstallCosts,
  totalCostPerItem,
}) {
  const colorSelection =
    currentMaterialPrice <= totalCostPerItem ? "error.main" : "success.main";

  return (
    <Grid container sx={{ marginTop: "20px" }}>
      <Grid container item xs={12} sx={{ marginTop: "5px" }}>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
            Total Materials
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: SMALL_TEXT_FORMAT }}
            align="right"
            color={colorSelection}
          >
            {totalCostOfMaterials.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
            Total Install Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: SMALL_TEXT_FORMAT }}
            align="right"
            color={colorSelection}
          >
            {totalInstallCosts.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
            Total Estimated Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: SMALL_TEXT_FORMAT }}
            align="right"
            color={colorSelection}
          >
            {(totalCostOfMaterials + totalInstallCosts).toLocaleString(
              undefined,
              TWO_DECIMAL_PLACES
            )}
          </Typography>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: SMALL_TEXT_FORMAT }}>
              {`Total Price Per Item`}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4} align="right">
            <Typography
              sx={{ typography: SMALL_TEXT_FORMAT }}
              align="right"
              color={colorSelection}
            >
              {totalCostPerItem.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
