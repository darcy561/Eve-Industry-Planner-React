import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

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
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Quantity
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography align="right" sx={{ typography: STANDARD_TEXT_FORMAT }}>
            {job.itemQuantity.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Setup Count:
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography align="right" sx={{ typography: STANDARD_TEXT_FORMAT }}>
            {job.totalSetupCount ? job.totalSetupCount.toLocaleString() : 0}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
