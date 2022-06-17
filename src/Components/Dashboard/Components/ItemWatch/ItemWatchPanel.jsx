import { Grid, Paper, Typography } from "@mui/material";

export function ItemWatchPanel() {
  return (
    <Paper
      sx={{
        padding: "20px",
        marginLeft: {
          xs: "5px",
          md: "10px",
        },
        marginRight: {
          xs: "5px",
          md: "10px",
        },
      }}
      square
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h5" color="primary" align="center">
            Item Watchlist
          </Typography>
        </Grid>
              
      </Grid>
    </Paper>
  );
}
