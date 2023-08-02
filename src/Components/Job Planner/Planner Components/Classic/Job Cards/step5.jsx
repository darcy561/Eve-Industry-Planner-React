import { Grid, Typography } from "@mui/material";

export default function Step5JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Market Orders
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            sx={{ typography: { xs: "body2", md: "body1" } }}
            align="right"
          >
            {job.apiOrders.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Transactions
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            sx={{ typography: { xs: "body2", md: "body1" } }}
            align="right"
          >
            {job.apiTransactions.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
