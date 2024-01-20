import { CircularProgress, Grid, Typography } from "@mui/material";

export function ImportingStateLayout_ChildJobPopoverFrame({
  fetchError,
  material,
}) {
  return (
    <Grid container>
      <Grid item xs={12} sx={{ marginBottom: "30px" }}>
        <Typography variant="body2" align="center">
          {material.name}
        </Typography>
      </Grid>
      {fetchError ? (
        <Grid item xs={12} sx={{ marginBottom: "20px" }} align="center">
          <Typography variant="body2" align="center" color="error">
            Error Importing Job Data
          </Typography>
        </Grid>
      ) : (
        <Grid item xs={12} sx={{ marginBottom: "20px" }} align="center">
          <CircularProgress color="primary" />
        </Grid>
      )}
    </Grid>
  );
}
