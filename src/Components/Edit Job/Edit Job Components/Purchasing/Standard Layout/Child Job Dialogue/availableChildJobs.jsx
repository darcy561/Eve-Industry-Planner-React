import { useContext } from "react";
import { Avatar, Grid, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";

export function AvailableChildJobs_Purchasing({
  availableChildJobs,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  material,
}) {
  if (availableChildJobs.length === 0) {
    return (
      <Grid item xs={12}>
        <Typography variant="body1" align="center">
          None Available
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid container sx={{ marginBottom: "40px" }}>
      {availableChildJobs.map((job) => {
        return (
          <AvailableJobEntry
            key={job.jobID}
            job={job}
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

function AvailableJobEntry({
  job,
  material,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { Add_RemovePendingChildJobs } = useHelperFunction();
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
}
