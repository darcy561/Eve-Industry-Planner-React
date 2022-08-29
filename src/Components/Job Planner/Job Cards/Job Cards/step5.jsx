import { Grid, Typography } from "@mui/material";
import { useContext } from "react";
import { JobArrayContext } from "../../../../Context/JobContext";

export default function Step5JobCard({ job }) {
  const { jobArray } = useContext(JobArrayContext);

  if (!job.isSnapshot) {
    job = jobArray.find((i)=> i.jobID === job.jobID)
  }
  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}}>Market Orders</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
            {job.isSnapshot
              ? job.linkedOrdersCount.toLocaleString()
              : job.build.sale.marketOrders.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}}>Transactions</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
            {job.isSnapshot
              ? job.linkedTransCount.toLocaleString()
              : job.build.sale.transactions.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
