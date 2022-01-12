import { useContext } from "react";
import {
  Grid,
  Paper,
  Typography,
  Checkbox,
} from "@mui/material";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function TutorialStep1() {
  const { activeJob } = useContext(ActiveJobContext);

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
      }}
      square={true}
    >
      <Grid container>
        <Grid item xs={12} align="left">
        <Typography variant="body1" color="primary">
            <b>Help:</b>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2">
            This is your first step along the way in building your{" "}
            {activeJob.name}, here you will find everything you need to
            calculate the resources that you need to complete your job.{<br />}
            {<br />}
            If you are wanting to also build any of the subcomponents used then
            simply use the <b>+</b> icon next to the resource name to create a
            new job that is already setup to build the correct amount for you.
            The color of the icon indicates the type of job of industry job
            required to make the item.
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={10} />
          <Grid item xs={2} align="right">
            <Typography variant="caption" sx={{ display: "inline-block" }}>
              Hide Help Options
            </Typography>
            <Checkbox size="small" />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
