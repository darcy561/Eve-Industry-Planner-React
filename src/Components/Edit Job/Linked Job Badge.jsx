import { useContext, useState } from "react";
import {
  Avatar,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { JobArrayContext } from "../../Context/JobContext";
import { ParentJobDialog } from "./parentJobDialog";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { useCloseActiveJob } from "../../Hooks/JobHooks/useCloseActiveJob";
import { useNavigate } from "react-router-dom";
import { useJobManagement } from "../../Hooks/useJobManagement";

export function LinkedJobBadge({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
  esiDataToLink,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const [dialogTrigger, updateDialogTrigger] = useState(false);
  const { closeActiveJob } = useCloseActiveJob();
  const { Add_RemovePendingParentJobs } = useJobManagement();

  const navigate = useNavigate();

  function findParent(inputID) {
    if (!activeJob.groupID) {
      return userJobSnapshot.find((i) => i.jobID === inputID);
    } else {
      return jobArray.find((i) => i.jobID === inputID);
    }
  }

  const parentJobSelection = [
    ...new Set(
      [...activeJob.parentJob, ...parentChildToEdit.parentJobs.add].filter(
        (i) => !parentChildToEdit.parentJobs.remove.includes(i)
      )
    ),
  ];

  return (
    <>
      <ParentJobDialog
        activeJob={activeJob}
        updateActiveJob={updateActiveJob}
        dialogTrigger={dialogTrigger}
        updateDialogTrigger={updateDialogTrigger}
        setJobModified={setJobModified}
        parentChildToEdit={parentChildToEdit}
        updateParentChildToEdit={updateParentChildToEdit}
      />
      <Stack
        direction="row"
        sx={{ marginBottom: { xs: "10px", sm: "0px" }, position: "relative" }}
      >
        <Grid container>
          <Grid
            item
            xs={12}
            align="center"
            sx={{ marginBottom: { xs: "10px", sm: "0px" } }}
          >
            <Typography variant="h6" color="primary">
              Parent Jobs
            </Typography>
          </Grid>
          <IconButton
            size="small"
            color="primary"
            sx={{ position: "absolute", top: "0px", right: "40px" }}
            onClick={() => {
              updateDialogTrigger(true);
            }}
          >
            <AddIcon />
          </IconButton>

          {parentJobSelection.map((jobID) => {
            let parent = findParent(jobID);
            if (!parent) return null;
            return (
              <Grid
                key={parent.jobID}
                item
                xs="auto"
                align="right"
                sx={{ padding: "5px 5px" }}
              >
                <Chip
                  key={parent.jobID}
                  label={parent.name}
                  size="large"
                  deleteIcon={<ClearIcon />}
                  avatar={
                    <Avatar
                      src={`https://image.eveonline.com/Type/${parent.itemID}_32.png`}
                    />
                  }
                  clickable
                  onClick={async () => {
                    await closeActiveJob(
                      activeJob,
                      jobModified,
                      temporaryChildJobs,
                      esiDataToLink,
                      parentChildToEdit
                    );
                    navigate(`/editjob/${parent.jobID}`);
                  }}
                  variant="outlined"
                  sx={{
                    "& .MuiChip-deleteIcon": {
                      color: "error.main",
                    },
                    boxShadow: 3,
                  }}
                  onDelete={() => {
                    const { newParentJobsToAdd, newParentJobsToRemove } =
                      Add_RemovePendingParentJobs(
                        parentChildToEdit.parentJobs,
                        jobID,
                        false
                      );
                    updateParentChildToEdit((prev) => ({
                      ...prev,
                      parentJobs: {
                        ...prev.parentJobs,
                        add: newParentJobsToAdd,
                        remove: newParentJobsToRemove,
                      },
                    }));

                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${parent.name} Unlinked`,
                      severity: "error",
                      autoHideDuration: 1000,
                    }));
                    setJobModified(true);
                  }}
                />
              </Grid>
            );
          })}
        </Grid>
      </Stack>
    </>
  );
}
