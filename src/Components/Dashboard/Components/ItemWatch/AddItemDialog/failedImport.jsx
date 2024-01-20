import { Grid, Typography } from "@mui/material";

export function FailedImport_WatchlistDialog() {
  return (
    <Grid item xs={12}>
      <Typography color="error" sx={{ marginTop: "20px" }}>
        Error Importing Job Data
      </Typography>
    </Grid>
  );
}
