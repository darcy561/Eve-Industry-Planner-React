import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextFields: {
    typography: { xs: "body2", md: "body1" },
  },
}));

export default function Step2JobCard({ job }) {
  const classes = useStyles();
  let totalComplete = 0;
  if (!job.isSnapshot) {
    job.build.materials.forEach((material) => {
      if (material.quantityPurchased >= material.quantity) {
        totalComplete++;
      }
    });
  }

  return (
    <Grid
      container
      item
      xs={10}
      sm={9}
      sx={{ paddingLeft: { xs: "0px", sm: "5px" } }}
    >
      <Grid container item xs={12}>
        {job.isSnapshot ? (
          job.totalComplete - job.totalMaterials !== 0 ? (
            <>
              <Grid item xs={10}>
                <Typography className={classes.TextFields}>
                  Awaiting Materials
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography className={classes.TextFields} align="right">
                  {job.totalMaterials - job.totalComplete}/{job.totalMaterials}
                </Typography>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Typography className={classes.TextFields}>
                Ready To Build
              </Typography>
            </Grid>
          )
        ) : totalComplete - job.build.materials.length !== 0 ? (
          <>
            <Grid item xs={10}>
              <Typography className={classes.TextFields}>
                Awaiting Materials
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography className={classes.TextFields} align="right">
                {job.build.materials.length - totalComplete}/
                {job.build.materials.length}
              </Typography>
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Typography className={classes.TextFields}>
              Ready To Build
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
