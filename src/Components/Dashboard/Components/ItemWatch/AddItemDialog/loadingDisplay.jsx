import { CircularProgress, Grid, Typography } from "@mui/material";

export function LoadingDisplay_WatchlistDialog({ loadingText }) {
  return (
    <Grid item xs={12} align="center">
      <CircularProgress color="primary" />
      <Typography sx={{ marginTop: "20px" }}>{loadingText}</Typography>
    </Grid>
  );
}
