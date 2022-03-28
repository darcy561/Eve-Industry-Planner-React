import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextFields: {
    typography: { xs: "body2", md: "body1" },
  },
}));

export default function Step1JobCard({ job }) {
  const classes = useStyles();
  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={8}>
          <Typography className={classes.TextFields}>Runs</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography align="right" className={classes.TextFields}>
            {job.runCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>Job Slots</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography align="right" className={classes.TextFields}>
            {job.jobCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
