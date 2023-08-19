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
import { useContext, useMemo } from "react";
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
import { useFindJobObject } from "../../../../../Hooks/GeneralHooks/useFindJobObject";
import { useJobSnapshotManagement } from "../../../../../Hooks/JobHooks/useJobSnapshots";

export function ChildJobDialog({
  material,
  childDialogTrigger,
  updateChildDialogTrigger,
  setJobModified,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob, updateActiveJob, activeGroup } =
    useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateJobSnapshot } = useJobSnapshotManagement();
  const { findJobData } = useFindJobObject();

  const handleClose = () => {
    updateChildDialogTrigger(false);
  };

  const matches = useMemo(() => {
    const jobs = activeJob.groupID === null ? userJobSnapshot : jobArray;
    const filteredJobs = jobs.filter(
      (job) =>
        job.itemID === material.typeID &&
        !material.childJob.includes(job.jobID) &&
        (activeJob.groupID === null || job.groupID === activeJob.groupID)
    );
    return filteredJobs;
  }, [activeJob, userJobSnapshot, jobArray, material]);

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
                        const newJobArray = [...jobArray];
                        let inputJob = await findJobData(
                          job.jobID,
                          newUserJobSnapshot,
                          newJobArray
                        );
                        const newMaterialArray = activeJob.build.materials.map(
                          (mat) => {
                            if (mat.typeID === material.typeID) {
                              mat.childJob.push(inputJob.jobID);
                            }
                            return mat;
                          }
                        );

                        inputJob.parentJob.push(activeJob.jobID);

                        newUserJobSnapshot = updateJobSnapshot(
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
                          await Promise.all([
                            uploadJob(inputJob),
                            uploadUserJobSnapshot(newUserJobSnapshot),
                          ]);
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
            material.childJob.map((childJobID) => {
              const findJobMatch = () => {
                const jobs =
                  activeJob.groupID === null ? userJobSnapshot : jobArray;
                return jobs.find((i) => i.jobID == childJobID);
              };

              const jobMatch = findJobMatch();
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
                        const newJobArray = [...jobArray];
                        const inputJob = await findJobData(
                          childJobID,
                          newUserJobSnapshot,
                          newJobArray
                        );

                        const newMaterialArray = activeJob.build.materials.map(
                          (material) => {
                            if (material.typeID === material.typeID) {
                              const newChildJob = material.childJob.filter(
                                (jobID) => jobID !== inputJob.jobID
                              );
                              return { ...material, childJob: newChildJob };
                            }
                            return material;
                          }
                        );

                        let parentIndex = inputJob.parentJob.findIndex(
                          (i) => i === activeJob.jobID
                        );
                        if (parentIndex !== -1) {
                          inputJob.parentJob.splice(parentIndex, 1);
                        }
                        newUserJobSnapshot = updateJobSnapshot(
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
                          await Promise.all([
                            uploadJob(inputJob),
                            uploadUserJobSnapshot(newUserJobSnapshot),
                          ]);
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
