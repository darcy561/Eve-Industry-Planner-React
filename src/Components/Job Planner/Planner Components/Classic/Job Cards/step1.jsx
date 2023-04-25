import { Grid, Typography } from "@mui/material";

export default function Step1JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        <Grid item xs={8}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Runs
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography
            align="right"
            sx={{ typography: { xs: "body2", md: "body1" } }}
          >
            {job.runCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Job Slots
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            align="right"
            sx={{ typography: { xs: "body2", md: "body1" } }}
          >
            {job.jobCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
