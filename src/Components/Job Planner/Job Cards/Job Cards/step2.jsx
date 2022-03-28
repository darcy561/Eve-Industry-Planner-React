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
    <Grid container item xs={10} sm={9} sx={{ paddingLeft: {xs:"0px", sm:"5px"}}}>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>Number of Materials</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.totalMaterials.toLocaleString()
              : job.build.materials.length.toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={10}>
          <Typography className={classes.TextFields}>Completed Purchases</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.TextFields} align="right">
            {job.isSnapshot
              ? job.totalComplete.toLocaleString()
              : totalComplete}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
