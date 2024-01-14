import { Grid, Typography } from "@mui/material";
import { TWO_DECIMAL_PLACES } from "../../../../../../../Context/defaultValues";

export function MaterialTotalsWithMarketPrices_MaterialPrices({
  listingSelect,
  activeJob,
  totalMaterialCost,
  totalInstallCosts,
  totalMarketPrice,
  totalBuildCost,
}) {
  const totalPrice = totalMaterialCost + totalInstallCosts;

  const textStyle = { xs: "caption", sm: "body2" };
  const formatedMarketTitle =
    listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1);
  const displayColor = getDisplayColor();

  function getDisplayColor() {
    if (totalPrice < totalMarketPrice) {
      return totalBuildCost + totalInstallCosts < totalPrice
        ? "orange"
        : "success.main";
    } else {
      return "error.main";
    }
  }

  return (
    <Grid container item xs={12} sx={{ marginTop: { xs: 2, sm: 0 } }}>
      <Grid item xs={12}>
        <Typography sx={{ typography: textStyle }}>
          {`Total Material ${formatedMarketTitle} Price`}
        </Typography>
        <Typography sx={{ typography: textStyle }}>
          {totalMaterialCost.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>
          Total Install Costs
        </Typography>
        <Typography sx={{ typography: textStyle }}>
          {totalInstallCosts.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>Total Cost</Typography>
        <Typography
          sx={{
            typography: textStyle,
            color: displayColor,
          }}
        >
          {totalPrice.toLocaleString(undefined, TWO_DECIMAL_PLACES)}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>
          Total Cost Per Item
        </Typography>
        <Typography sx={{ typography: textStyle, color: displayColor }}>
          {(totalPrice / activeJob.build.products.totalQuantity).toLocaleString(
            undefined,
            TWO_DECIMAL_PLACES
          )}
        </Typography>
      </Grid>
      <Grid item xs={12} sx={{ marginTop: 1 }}>
        <Typography sx={{ typography: textStyle }}>Profit/Loss</Typography>
        <Typography sx={{ typography: textStyle, color: displayColor }}>
          {(totalMarketPrice - totalPrice).toLocaleString(
            undefined,
            TWO_DECIMAL_PLACES
          )}
        </Typography>
      </Grid>
    </Grid>
  );
}
