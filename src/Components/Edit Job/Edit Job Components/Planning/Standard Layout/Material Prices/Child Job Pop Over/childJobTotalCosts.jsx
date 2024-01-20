import { Grid, Typography } from "@mui/material";

export function ChildJobMaterialTotalCosts_ChildJobPopoverFrame({
  currentMaterialPrice,
  totalCostOfMaterials,
  totalInstallCosts,
  totalCostPerItem,
}) {

  const colorSelection =
    currentMaterialPrice <= totalCostPerItem  ? "error.main" : "success.main";

  return (
    <Grid container sx={{ marginTop: "20px" }}>
      <Grid container item xs={12} sx={{ marginTop: "5px" }}>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
            Total Materials
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "caption" } }}
            align="right"
            color={colorSelection}
          >
            {totalCostOfMaterials.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
            Total Install Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "caption" } }}
            align="right"
            color={colorSelection}
          >
            {totalInstallCosts.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Typography sx={{ typography: { xs: "caption", sm: "caption" } }}>
            Total Estimated Cost
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4} align="right">
          <Typography
            sx={{ typography: { xs: "caption", sm: "caption" } }}
            align="right"
            color={colorSelection}
          >
            {(totalCostOfMaterials + totalInstallCosts).toLocaleString(
              undefined,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </Typography>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "10px" }}>
          <Grid item xs={12} sm={8}>
            <Typography sx={{ typography: { xs: "caption", sm: "caption"   } }}>
              {`Total Price Per Item`}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4} align="right">
            <Typography
              sx={{ typography: { xs: "caption", sm: "caption" } }}
              align="right"
              color={colorSelection}
            >
              {totalCostPerItem.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
