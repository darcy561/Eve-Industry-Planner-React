import { CircularProgress, Grid } from "@mui/material";

export function LoadingDataDisplay_ShoppingListDialog({ loadingData }) {
  if (!loadingData) return null;

  return (
    <Grid container>
      <Grid item xs={12} align="center">
        <CircularProgress color="primary" />
      </Grid>
    </Grid>
  );
}
