import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextFields: {
    typography: { xs: "body2", md: "body1" },
  },
}));

export default function Step5JobCard({ job }) {
  const classes = useStyles();
  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>Market Orders</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.linkedOrdersCount.toLocaleString()
              : job.build.sale.marketOrders.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>Transactions</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.linkedTransCount.toLocaleString()
              : job.build.sale.transactions.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
