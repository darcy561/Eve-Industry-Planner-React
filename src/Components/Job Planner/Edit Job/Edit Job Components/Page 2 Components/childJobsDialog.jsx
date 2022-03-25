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
import { IsLoggedInContext } from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function ChildJobDialog({
  material,
  childDialogTrigger,
  updateChildDialogTrigger,
  setJobModified,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { downloadCharacterJobs, uploadJob } = useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateJobSnapshot } = useJobManagement();

  const handleClose = () => {
    updateChildDialogTrigger(false);
  };

  let matches = [];
  for (let job of jobArray) {
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
                        if (job.isSnapshot) {
                          job = await downloadCharacterJobs(job);
                          job.isSnapshot = false;
                        }
                        let newMaterialArray = [...activeJob.build.materials];
                        let index = newMaterialArray.findIndex(
                          (i) => i.typeID === material.typeID
                        );
                        newMaterialArray[index].childJob.push(job.jobID);

                        job.parentJob.push(activeJob.jobID);

                        updateJobSnapshot(job);

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
                          message: `${job.name} Linked`,
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        if (isLoggedIn) {
                          uploadJob(job);
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
              let jobMatch = jobArray.find((i) => i.jobID === job);
              if (jobMatch !== undefined) {
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
                          if (jobMatch.isSnapshot) {
                            jobMatch = await downloadCharacterJobs(jobMatch);
                            jobMatch.isSnapshot = false;
                          }
                          let newMaterialArray = [...activeJob.build.materials];
                          let matIndex = newMaterialArray.findIndex(
                            (i) => i.typeID === material.typeID
                          );
                          let matChildIndex = newMaterialArray[
                            matIndex
                          ].childJob.findIndex((i) => i === jobMatch.jobID);
                          if (matChildIndex !== -1) {
                            newMaterialArray[matIndex].childJob.splice(
                              matChildIndex,
                              1
                            );
                          }

                          let parentIndex = jobMatch.parentJob.findIndex(
                            (i) => i === activeJob.jobID
                          );
                          if (parentIndex !== -1) {
                            jobMatch.parentJob.splice(parentIndex, 1);
                          }
                          updateJobSnapshot(jobMatch);

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
                            message: `${jobMatch.name} Unlinked`,
                            severity: "success",
                            autoHideDuration: 1000,
                          }));
                          if (isLoggedIn) {
                            updateJobSnapshot()
                            uploadJob(jobMatch);
                          }
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                );
              }
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
