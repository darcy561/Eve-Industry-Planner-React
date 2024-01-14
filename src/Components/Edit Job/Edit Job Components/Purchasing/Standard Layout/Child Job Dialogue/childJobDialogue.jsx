import { useContext, useMemo } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";

export function ChildJobDialogue({
  activeJob,
  updateActiveJob,
  material,
  childDialogTrigger,
  updateChildDialogTrigger,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { Add_RemovePendingChildJobs } = useJobManagement();

  const materialChildJobs = [
    ...activeJob.build.childJobs[material.typeID],
    ...(temporaryChildJobs[material.typeID]
      ? [temporaryChildJobs[material.typeID].jobID]
      : []),
    ...(parentChildToEdit.childJobs[material.typeID]?.add
      ? parentChildToEdit.childJobs[material.typeID].add
      : []),
  ].filter(
    (i) => !parentChildToEdit.childJobs[material.typeID]?.remove.includes(i)
  );

  const handleClose = () => {
    updateChildDialogTrigger(false);
  };

  const matches = useMemo(() => {
    const jobs = !activeJob.groupID ? userJobSnapshot : jobArray;
    const filteredJobs = jobs.filter(
      (job) =>
        job.itemID === material.typeID &&
        !materialChildJobs.includes(job.jobID) &&
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
                      Setups: {job.totalSetupCount ? job.totalSetupCount : 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        const { newChildJobstoAdd, newChildJobsToRemove } =
                          Add_RemovePendingChildJobs(
                            parentChildToEdit.childJobs[material.typeID],
                            job.jobID,
                            true
                          );

                        updateParentChildToEdit((prev) => ({
                          ...prev,
                          childJobs: {
                            [material.typeID]: {
                              ...prev.childJobs[material.typeID],
                              add: [...newChildJobstoAdd],
                              remove: [...newChildJobsToRemove],
                            },
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
          {materialChildJobs.length > 0 ? (
            materialChildJobs.map((childJobID) => {
              const jobMatch = jobArray.find((i) => i.jobID == childJobID);
              if (!jobMatch) return null;
              const setupCount = Object.values(jobMatch.build.setup).reduce(
                (prev, setup) => {
                  return prev + 1;
                },
                0
              );

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
                      Setups: {setupCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        const { newChildJobstoAdd, newChildJobsToRemove } =
                          Add_RemovePendingChildJobs(
                            parentChildToEdit.childJobs[material.typeID],
                            jobMatch.jobID,
                            false
                          );

                        updateParentChildToEdit((prev) => ({
                          ...prev,
                          childJobs: {
                            [material.typeID]: {
                              ...prev.childJobs[material.typeID],
                              add: [...newChildJobstoAdd],
                              remove: [...newChildJobsToRemove],
                            },
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
