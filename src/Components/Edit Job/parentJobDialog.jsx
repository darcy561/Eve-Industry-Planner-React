import { useContext, useEffect, useState } from "react";
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
import { JobArrayContext } from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { UserJobSnapshotContext } from "../../Context/AuthContext";

export function ParentJobDialog({
  activeJob,
  updateActiveJob,
  dialogTrigger,
  updateDialogTrigger,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [matches, updateMatches] = useState([]);

  const handleClose = () => {
    updateDialogTrigger(false);
  };

  useEffect(() => {
    if (!dialogTrigger) {
      return;
    }
    let newMatches = [];
    if (!activeJob.groupID) {
      for (let job of userJobSnapshot) {
        if (
          job.materialIDs.includes(activeJob.itemID) &&
          !activeJob.parentJob.includes(job.jobID)
        ) {
          newMatches.push(job);
        }
      }
    } else {
      let matchs = jobArray.filter(
        (i) =>
          i.groupID === activeJob.groupID &&
          !activeJob.parentJob.includes(i.jobID) &&
          i.build.materials.some((x) => x.typeID === activeJob.itemID)
      );
      newMatches = newMatches.concat(matchs);
    }
    updateMatches(newMatches);
  }, [dialogTrigger]);

  return (
    <Dialog
      open={dialogTrigger}
      onClose={handleClose}
      sx={{ padding: "20px", width: "100%" }}
    >
      <DialogTitle
        id="ParentJobDialog"
        align="center"
        sx={{ marginBottom: "10px" }}
        color="primary"
      >
        Link Parent Job
      </DialogTitle>
      <DialogContent>
        <Grid container>
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
                      src={`https://images.evetech.net/types/${job.itemID}/icon?size=32`}
                      alt=""
                    />
                  </Grid>
                  <Grid item xs={6} align="center" sx={{ paddingLeft: "10px" }}>
                    <Typography variant="body1">{job.name}</Typography>
                  </Grid>
                  <Grid item xs={4} align="center">
                    <Typography variant="body2">
                      Runs {job.runCount} Jobs {job.jobCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        const newParentJobArray = [...activeJob.parentJob];
                        const newParentJobsToAdd = new Set(
                          parentChildToEdit.parentJobs.add
                        );
                        const newParentJobsToRemove = new Set(
                          parentChildToEdit.parentJobs.remove
                        );

                        newParentJobsToAdd.add(job.jobID);
                        newParentJobsToRemove.delete(job.jobID);

                        newParentJobArray.push(job.jobID);

                        updateParentChildToEdit((prev) => ({
                          ...prev,
                          parentJobs: {
                            ...prev.parentJobs,
                            add: [...newParentJobsToAdd],
                            remove: [...newParentJobsToRemove],
                          },
                        }));
                        updateActiveJob((prev) => ({
                          ...prev,
                          parentJob: newParentJobArray,
                        }));
                        setJobModified(true);
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: `${job.name} Linked`,
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        handleClose();
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
              No Jobs Available
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
