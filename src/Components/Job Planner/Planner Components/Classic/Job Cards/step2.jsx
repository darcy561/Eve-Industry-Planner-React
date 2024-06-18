import { Grid, Typography } from "@mui/material";
import { STANDARD_TEXT_FORMAT } from "../../../../../Context/defaultValues";

export default function Step2JobCard({ job }) {
  const isNotReadyToBuild = job.totalComplete - job.totalMaterials !== 0;

  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12} sx={{ alignItems: "center" }}>
        {isNotReadyToBuild ? (
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
                {job.totalMaterials - job.totalComplete}/{job.totalMaterials}
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
