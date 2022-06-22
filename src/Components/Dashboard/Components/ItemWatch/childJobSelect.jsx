import { Grid, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Grid: {
    "&:hover": {
      backgroundColor: "lightGrey",
    },
  },
}));

export function ChildJobEntry({ job }) {
  const classes = useStyles();

  return (
    <Grid container item xs={3} align="center" className={classes.Grid}>
      <Grid item xs={12} align="center">
        <img
          src={`https://images.evetech.net/types/${job.itemID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid item xs={12} align="center">
        <Typography align="center" variant="caption">{job.name}</Typography>
      </Grid>
    </Grid>
  );
}
