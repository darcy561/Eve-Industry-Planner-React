import { Grid, Typography } from "@mui/material";

<<<<<<< HEAD
export default function GroupStep1JobCard({ job }) {

    const totalSetupCount = Object.values(job.build.setup).reduce((prev, setup) => {
        return prev + 1
    }, 0)

=======
export default function Step1JobCard({ job }) {
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
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
<<<<<<< HEAD
            {job.build.products.totalQuantity.toLocaleString()}
=======
            {job.itemQuantity.toLocaleString()}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
<<<<<<< HEAD
          <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
=======
          <Typography sx={{ typography: { xs: "body2", md: "bo  dy1" } }}>
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
            Setup Count:
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography
            align="right"
<<<<<<< HEAD
            sx={{ typography: { xs: "body2", md: "body1" } }}
          >
            {totalSetupCount.toLocaleString()}
=======
            sx={{ typography: { xs: "body2", md: "body1" } }} 
          >
            {job.totalSetupCount ? job.totalSetupCount.toLocaleString() : 0}
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
