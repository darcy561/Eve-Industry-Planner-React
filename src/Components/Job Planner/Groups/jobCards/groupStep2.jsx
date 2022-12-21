import { Grid, Typography } from "@mui/material";

export default function GroupStep2JobCard({ job }) {
  let totalComplete = 0;

  job.build.materials.forEach((material) => {
    if (material.quntityPurchased >= material.quantity) {
      totalComplete++;
    }
  });
  
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
              <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
                Awaiting Materials
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography
                sx={{ typography: { xs: "body2", md: "body1" } }}
                align="right"
              >
                {job.build.materials.length - totalComplete}/
                {job.build.materials.length}
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
