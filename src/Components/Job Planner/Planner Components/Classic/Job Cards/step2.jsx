import { Grid, Typography } from "@mui/material";

export default function Step2JobCard({ job }) {
  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        {job.totalComplete - job.totalMaterials !== 0 ? (
          <>
            <Grid item xs={10}>
              <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
                Awaiting Materials
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "body2", md: "body1" } }}
                align="right"
              >
                {job.totalMaterials - job.totalComplete}/{job.totalMaterials}
              </Typography>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
              Ready To Build
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
