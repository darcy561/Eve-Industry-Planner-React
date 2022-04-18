import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextFields: {
    typography: { xs: "body2", md: "body1" },
  },
}));

export default function Step3JobCard({ job }) {
  const classes = useStyles();

  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>ESI Jobs Linked</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.linkedJobsCount.toLocaleString()
              : job.build.costs.linkedJobs.length.toLocaleString()}/{job.jobCount}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
