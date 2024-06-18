import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

export default function Step4JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12} sx={{alignItems:"center"}}>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
            Items Built
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ typography: STANDARD_TEXT_FORMAT }} align="right">
            {job.itemQuantity.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
