import { useContext, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { AvailableChildJobs_Purchasing } from "./availableChildJobs";
import { ExistingChildJobs_Purchasing } from "./existingChildJobs";

export function ChildJobDialogue({
  activeJob,
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

  const existingChildJobs = [
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

  function handleClose() {
    updateChildDialogTrigger(false);
  }

  const availableChildJobs = useMemo(() => {
    const jobs = !activeJob.groupID ? userJobSnapshot : jobArray;
    const filteredJobs = jobs.filter(
      (job) =>
        job.itemID === material.typeID &&
        !existingChildJobs.includes(job.jobID) &&
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
        Available Child Jobs
      </DialogTitle>
      <DialogContent>
        <AvailableChildJobs_Purchasing
          availableChildJobs={availableChildJobs}
          material={material}
          setJobModified={setJobModified}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
        <Grid item sx={{ marginBottom: "10px" }}>
          <Typography variant="h6" color="primary" align="center">
            Linked Child Jobs
          </Typography>
        </Grid>
        <ExistingChildJobs_Purchasing
          existingChildJobs={existingChildJobs}
          material={material}
          setJobModified={setJobModified}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
