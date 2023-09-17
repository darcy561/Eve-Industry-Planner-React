import { Grid, Paper, Typography } from "@mui/material";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { ManufacturingLayout_BlueprintPanel } from "./manufacturingLayout";

export function AvailableBlueprintsPanel({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
}) {
  return (
    <Paper elevation={3} sx={{ padding: "20px", minWidth: "100%" }} square>
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" align="center" color="primary">
            Blueprint Library
          </Typography>
        </Grid>
        <LayoutSwitcher
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      </Grid>
    </Paper>
  );
}

function LayoutSwitcher({ activeJob, updateActiveJob, setJobModified }) {
  switch (activeJob.jobType) {
    case jobTypes.manufacturing:
      return (
        <ManufacturingLayout_BlueprintPanel
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      );
    case jobTypes.reaction:
      return null;
    default:
      return (
        <Grid item xs={12} align="center">
          <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
            No Blueprints Found
          </Typography>
        </Grid>
      );
  }
}
