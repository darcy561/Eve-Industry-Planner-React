import { useContext } from "react";
import { Avatar, Grid, IconButton, Typography } from "@mui/material";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import ClearIcon from "@mui/icons-material/Clear";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function ExistingChildJobs_Purchasing({
  existingChildJobs,
  material,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  if (existingChildJobs.length === 0) {
    return (
      <Grid item xs={12}>
        <Typography variant="body1" align="center">
          None Linked
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid container item>
      {existingChildJobs.map((childJobID) => {
        return (
          <ChildJobEntry
            key={childJobID}
            childJobID={childJobID}
            setJobModified={setJobModified}
            parentChildToEdit={parentChildToEdit}
            updateParentChildToEdit={updateParentChildToEdit}
            material={material}
          />
        );
      })}
    </Grid>
  );
}

function ChildJobEntry({
  childJobID,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  material,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { Add_RemovePendingChildJobs, sendSnackbarNotificationSuccess } =
    useHelperFunction();

  const job = jobArray.find((i) => i.jobID == childJobID);
  if (!job) return null;
  const setupCount = Object.values(job.build.setup).reduce((prev, setup) => {
    return prev + 1;
  }, 0);
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
        <Avatar
          src={`https://image.eveonline.com/Type/${job.itemID}_32.png`}
          alt={job.name}
          variant="square"
          sx={{ height: 32, width: 32 }}
        />
      </Grid>
      <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
        <Typography variant="body1">{job.name}</Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="body2">Setups: {setupCount}</Typography>
      </Grid>
      <Grid item xs={1}>
        <IconButton
          size="small"
          color="error"
          onClick={() => {
            const { newChildJobstoAdd, newChildJobsToRemove } =
              Add_RemovePendingChildJobs(
                parentChildToEdit.childJobs[material.typeID],
                job.jobID,
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
            sendSnackbarNotificationSuccess(`${job.name} Unlinked`);
          }}
        >
          <ClearIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
}
