import { Grid, Typography } from "@mui/material";

export default function GroupStep1JobCard({ job }) {

    const childJobCount = Object.values(job.build.childJobs).reduce((prev, childJobArray) => {
        return prev += childJobArray.length
    }, 0)

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
            Quantity
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography
            align="right"
            sx={{ typography: { xs: "body2", md: "body1" } }}
          >
            {job.build.products.totalQuantity.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
            Child Jobs
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            align="right"
            sx={{ typography: { xs: "body2", md: "body1" } }}
          >
            {childJobCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
