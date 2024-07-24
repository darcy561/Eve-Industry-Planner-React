import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

export default function Step5JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12} sx={{ alignItems: "center" }}>
        <Grid item xs={10}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Market Orders
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.apiOrders.size.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Transactions
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.apiTransactions.size.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
