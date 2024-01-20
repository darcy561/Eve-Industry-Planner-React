import { CircularProgress, Grid } from "@mui/material";

export function LoadingAssetData({ loadingAssets }) {
  if (!loadingAssets) return null;

  return (
    <Grid item xs={12} align="center">
      <CircularProgress color="primary" />
    </Grid>
  );
}
