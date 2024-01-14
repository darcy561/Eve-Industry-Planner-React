import { Grid, Typography } from "@mui/material";

export function NoAssetsFound_AssetsDialog({ topLevelAssets }) {
  if (!topLevelAssets || topLevelAssets.size > 0) return null;

  return (
    <Grid container align="center">
      <Typography>No Items Found</Typography>
    </Grid>
  );
}
