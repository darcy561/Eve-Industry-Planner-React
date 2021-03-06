import { Grid, Typography } from "@mui/material";

export default function Step4JobCard({ job }) {
  return (
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={6}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}}>Items Built</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{typography:{xs:"body2", md:"body1"}}} align="right">
            {job.isSnapshot
              ? job.itemQuantity.toLocaleString()
              : job.build.products.totalQuantity.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
