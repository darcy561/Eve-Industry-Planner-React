import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

export default function GroupStep2JobCard({ job }) {
  const totalComplete = job.totalCompletedMaterials();

  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        {totalComplete - job.build.materials.length !== 0 ? (
          <>
            <Grid item xs={10}>
              <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                Awaiting Materials
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: STANDARD_TEXT_FORMAT }}
                align="right"
              >
                {job.build.materials.length - totalComplete}/
                {job.build.materials.length}
              </Typography>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              Ready To Build
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
