import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";
import { useHelperFunction } from "../../../../../Hooks/GeneralHooks/useHelperFunctions";

export default function GroupStep1JobCard({ job }) {
  const { getJobSetupCount } = useHelperFunction();
  const totalSetupCount = getJobSetupCount(job);

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
            {job.build.products.totalQuantity.toLocaleString()}
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
            {totalSetupCount.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
