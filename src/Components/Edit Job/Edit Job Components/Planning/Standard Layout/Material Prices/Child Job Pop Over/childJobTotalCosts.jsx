import { Grid, Typography } from "@mui/material";

export function ChildJobMaterialTotalCosts_ChildJobPopoverFrame({
  material,
  currentInstallCost,
  currentMaterialPrice,
  currentPurchasePrice,
  listingSelect,
}) {
  const currentTotalPrice = currentMaterialPrice + currentInstallCost;

  const colorSelection =
    currentPurchasePrice <= currentTotalPrice ? "error.main" : "success.main";

  return (
    <Grid container sx={{ marginTop: "20px" }}>
      <Grid container item xs={12}>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {`Total Material 
            ${listingSelect.charAt(0).toUpperCase() + listingSelect.slice(1)} 
            Price Per Item`}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {currentMaterialPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12} sx={{ marginTop: "5px" }}>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            {`Total Material 
                  ${
                    listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)
                  } 
                  Price`}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {(currentMaterialPrice * material.quantity).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Total Install Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {currentInstallCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            Total Estimated Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
            color={colorSelection}
          >
            {currentTotalPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
