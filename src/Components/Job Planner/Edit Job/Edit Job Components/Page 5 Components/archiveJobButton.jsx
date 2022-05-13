import { Button, Grid, Tooltip } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { UsersContext } from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function ArchiveJobButton({ updateJobSettingsTrigger }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { archiveJob, updateMainUserDoc } = useFirebase();
  const { deleteJobSnapshot } = useJobManagement();
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const archiveJobProcess = async () => {

    logEvent(analytics, "Archive Job", {
      UID: parentUser.accountID,
      jobID: activeJob.jobID,
      name: activeJob.name,
      itemID: activeJob.itemID,
      stage: activeJob.status
    })

    const newJobArray = jobArray.filter((job) => job.jobID !== activeJob.jobID);

    updateJobArray(newJobArray);

    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${activeJob.name} Archived`,
      severity: "success",
      autoHideDuration: 3000,
    }));
    await deleteJobSnapshot(activeJob)
    await updateMainUserDoc()
    await archiveJob(activeJob);
    updateJobSettingsTrigger((prev) => !prev);
  };

  return (
    <Grid
      container
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="center">
        <Tooltip
          arrow
          title="Removes the job from your planner but stores the data for later use in reporting and cost calculations. If you do not wish to store this job data then simply delete the job."
        >
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={archiveJobProcess}
          >
            Archive Job
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
