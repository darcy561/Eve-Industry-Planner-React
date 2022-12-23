import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import ClearIcon from "@mui/icons-material/Clear";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function ChildJobDialog({
  material,
  childDialogTrigger,
  updateChildDialogTrigger,
  setJobModified,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { downloadCharacterJobs, uploadJob, uploadUserJobSnapshot } =
    useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateJobSnapshotFromFullJob, findJobData } = useJobManagement();

  const handleClose = () => {
    updateChildDialogTrigger(false);
  };

  let matches = [];
  for (let job of userJobSnapshot) {
    if (
      job.itemID === material.typeID &&
      !material.childJob.includes(job.jobID)
    ) {
      matches.push(job);
    }
  }

  return (
    <Dialog
      open={childDialogTrigger}
      onClose={handleClose}
      sx={{ padding: "20px", width: "100%" }}
    >
      <DialogTitle id="ParentJobDialog" align="center" color="primary">
        Available Child Job
      </DialogTitle>
      <DialogContent>
        <Grid container sx={{ marginBottom: "40px" }}>
          {matches.length > 0 ? (
            matches.map((job) => {
              return (
                <Grid
                  container
                  key={job.jobID}
                  item
                  xs={12}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Grid
                    item
                    sm={1}
                    sx={{
                      display: { xs: "none", sm: "block" },
                    }}
                    align="center"
                  >
                    <img
                      src={`https://image.eveonline.com/Type/${job.itemID}_32.png`}
                      alt=""
                    />
                  </Grid>
                  <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
                    <Typography variant="body1">{job.name}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Runs: {job.runCount} Jobs: {job.jobCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={async () => {
                        let newUserJobSnapshot = [...userJobSnapshot];
                        let newJobArray = [...jobArray];
                        let [inputJob] = await findJobData(
                          job.jobID,
                          newUserJobSnapshot,
                          newJobArray
                        );
                        let newMaterialArray = [...activeJob.build.materials];
                        let index = newMaterialArray.findIndex(
                          (i) => i.typeID === material.typeID
                        );
                        newMaterialArray[index].childJob.push(inputJob.jobID);

                        inputJob.parentJob.push(activeJob.jobID);

                        newUserJobSnapshot = updateJobSnapshotFromFullJob(
                          inputJob,
                          newUserJobSnapshot
                        );

                        updateActiveJob((prev) => ({
                          ...prev,
                          build: {
                            ...prev.build,
                            materials: newMaterialArray,
                          },
                        }));
                        updateJobArray(newJobArray);
                        updateUserJobSnapshot(newUserJobSnapshot);
                        setJobModified(true);
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: `${inputJob.name} Linked`,
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        if (isLoggedIn) {
                          uploadJob(inputJob);
                          uploadUserJobSnapshot(newUserJobSnapshot);
                        }
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                None Available
              </Typography>
            </Grid>
          )}
        </Grid>
        <Grid item sx={{ marginBottom: "10px" }}>
          <Typography variant="h6" color="primary" align="center">
            Linked Child Jobs
          </Typography>
        </Grid>
        <Grid container item>
          {material.childJob.length > 0 ? (
            material.childJob.map((job) => {
              let jobMatch = userJobSnapshot.find((i) => i.jobID === job);
              if (jobMatch === undefined) {
                return null;
              }
              return (
                <Grid
                  container
                  key={jobMatch.jobID}
                  item
                  xs={12}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Grid
                    item
                    sm={1}
                    sx={{
                      display: { xs: "none", sm: "block" },
                    }}
                    align="center"
                  >
                    <img
                      src={`https://image.eveonline.com/Type/${jobMatch.itemID}_32.png`}
                      alt=""
                    />
                  </Grid>
                  <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
                    <Typography variant="body1">{jobMatch.name}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2">
                      Runs: {jobMatch.runCount} Jobs: {jobMatch.jobCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={async () => {
                        let newUserJobSnapshot = [...userJobSnapshot];
                        let newJobArray = [...jobArray];
                        let [inputJob] = await findJobData(
                          job,
                          newUserJobSnapshot,
                          newJobArray
                        );

                        let newMaterialArray = [...activeJob.build.materials];
                        let matIndex = newMaterialArray.findIndex(
                          (i) => i.typeID === material.typeID
                        );
                        let matChildIndex = newMaterialArray[
                          matIndex
                        ].childJob.findIndex((i) => i === inputJob.jobID);
                        if (matChildIndex !== -1) {
                          newMaterialArray[matIndex].childJob.splice(
                            matChildIndex,
                            1
                          );
                        }

                        let parentIndex = inputJob.parentJob.findIndex(
                          (i) => i === activeJob.jobID
                        );
                        if (parentIndex !== -1) {
                          inputJob.parentJob.splice(parentIndex, 1);
                        }
                        newUserJobSnapshot = updateJobSnapshotFromFullJob(
                          inputJob,
                          newUserJobSnapshot
                        );

                        updateUserJobSnapshot(newUserJobSnapshot);
                        updateJobArray(newJobArray);
                        updateActiveJob((prev) => ({
                          ...prev,
                          build: {
                            ...prev.build,
                            materials: newMaterialArray,
                          },
                        }));
                        setJobModified(true);
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: `${inputJob.name} Unlinked`,
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        if (isLoggedIn) {
                          uploadJob(inputJob);
                          uploadUserJobSnapshot(newUserJobSnapshot);
                        }
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                None Linked
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
