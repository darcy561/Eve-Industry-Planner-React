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
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { useFirebase } from "../../../Hooks/useFirebase";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";

export function ParentJobDialog({
  dialogTrigger,
  updateDialogTrigger,
  setJobModified,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { downloadCharacterJobs, uploadJob } = useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const{updateJobSnapshot } = useJobManagement()

  const handleClose = () => {
    updateDialogTrigger(false);
  };

  let matches = [];
  for (let job of jobArray) {
    if (job.isSnapshot) {
      if (
        job.materialIDs.includes(activeJob.itemID) &&
        !activeJob.parentJob.includes(job.jobID)
      ) {
        matches.push(job);
      }
    } else {
      if (
        job.build.materials.some((mat) => mat.typeID === activeJob.itemID) &&
        !activeJob.parentJob.includes(job.jobID)
      ) {
        matches.push(job);
      }
    }
  }

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
                  <Grid item xs={4}align="center">
                    <Typography variant="body2">
                      ME {job.bpME} TE {job.bpTE}
                    </Typography>
                    <Typography variant="body2">
                      Runs {job.runCount} Jobs {job.jobCount}
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
                        let material = job.build.materials.find(
                          (i) => i.typeID === activeJob.itemID
                        );
                        material.childJob.push(activeJob.jobID);
                        let newParentJobArray = [...activeJob.parentJob];
                        newParentJobArray.push(job.jobID);
                        updateJobSnapshot(job)
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
