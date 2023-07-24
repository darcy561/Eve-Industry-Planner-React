import {
  Avatar,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { ParentJobDialog } from "./parentJobDialog";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../Context/AuthContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import { useSwitchActiveJob } from "../../../Hooks/JobHooks/useSwitchActiveJob";
import { useFindJobObject } from "../../../Hooks/GeneralHooks/useFindJobObject";

export function LinkedJobBadge({ jobModified, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const [dialogTrigger, updateDialogTrigger] = useState(false);
  const { uploadUserJobSnapshot, uploadJob } = useFirebase();
  const { updateJobSnapshotFromFullJob } = useJobManagement();
  const { findJobData } = useFindJobObject();
  const { switchActiveJob } = useSwitchActiveJob();

  return (
    <>
      <ParentJobDialog
        dialogTrigger={dialogTrigger}
        updateDialogTrigger={updateDialogTrigger}
        setJobModified={setJobModified}
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

          {activeJob.parentJob.map((jobID) => {
            let findParent = () => {
              if (!activeJob.groupID) {
                return userJobSnapshot.find((i) => i.jobID === jobID);
              } else {
                return jobArray.find((i) => i.jobID === jobID);
              }
            };
            let parent = findParent();
            if (!parent) {
              return null;
            }
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
                    await switchActiveJob(activeJob, parent.jobID, jobModified);
                  }}
                  variant="outlined"
                  sx={{
                    "& .MuiChip-deleteIcon": {
                      color: "error.main",
                    },
                    boxShadow: 3,
                  }}
                  onDelete={async () => {
                    let newJobArray = [...jobArray];
                    let newUserJobSnapshot = [...userJobSnapshot];
                    let selectedJob = await findJobData(
                      parent.jobID,
                      newUserJobSnapshot,
                      newJobArray
                    );
                    if (!selectedJob) {
                      return;
                    }
                    let newParentMaterials = [...selectedJob.build.materials];
                    const material = newParentMaterials.find(
                      (i) => i.typeID === activeJob.itemID
                    );

                    material.childJob = material.childJob.filter(
                      (i) => i !== activeJob.jobID
                    );

                    let newParentJobs = [...activeJob.parentJob];

                    newParentJobs = newParentJobs.filter(
                      (i) => i !== selectedJob.jobID
                    );
                    newUserJobSnapshot = updateJobSnapshotFromFullJob(
                      selectedJob,
                      newUserJobSnapshot
                    );
                    updateJobArray(newJobArray);
                    updateUserJobSnapshot(newUserJobSnapshot);
                    updateActiveJob((prev) => ({
                      ...prev,
                      parentJob: newParentJobs,
                    }));

                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${selectedJob.name} Unlinked`,
                      severity: "error",
                      autoHideDuration: 1000,
                    }));
                    setJobModified(true);
                    if (isLoggedIn) {
                      uploadJob(selectedJob);
                      uploadUserJobSnapshot(newUserJobSnapshot);
                    }
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
