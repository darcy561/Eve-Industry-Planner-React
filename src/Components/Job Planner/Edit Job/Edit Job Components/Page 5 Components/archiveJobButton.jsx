import { Button, Grid, Tooltip } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  ApiJobsContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";

export function ArchiveJobButton() {
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { apiJobs, updateApiJobs } = useContext(ApiJobsContext);
  const { archivedJob } = useFirebase();

  const archiveJob = () => {
    archivedJob(activeJob);
    const parentUserIndex = users.findIndex(
      (i) => i.ParentUser === true
    );
    let newUsersArray = users;
    
  };

  return (
    <Grid
      container
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="right">
        <Tooltip
          arrow
          title="Removes the job from your planner but stores the data for later use. If you do not wish to store this job data then simply delete the job."
        >
          <Button
            color="primary"
            variant="contained"
            size="large"
            onClick={archiveJob}
          >
            Archive Job
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
