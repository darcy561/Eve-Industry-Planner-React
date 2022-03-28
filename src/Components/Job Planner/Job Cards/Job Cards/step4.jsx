import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextFields: {
    typography: { xs: "body2", md: "body1" },
  },
}));

export default function Step4JobCard({ job }) {
  const classes = useStyles();
  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={6}>
          <Typography className={classes.TextFields}>Items Built</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.itemQuantity.toLocaleString()
              : job.build.products.totalQuantity.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
