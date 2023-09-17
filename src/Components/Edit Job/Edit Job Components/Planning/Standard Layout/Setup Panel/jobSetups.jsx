import { Grid, IconButton, Paper, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSetupManagement } from "../../../../../../Hooks/GeneralHooks/useSetupManagement";
import { JobSetupCard } from "./jobSetupCard";

export function JobSetupPanel({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { addNewSetup } = useSetupManagement();

  return (
    <Paper
      sx={{
        minWidth: "100%",
        padding: "20px",
        position: "relative",
      }}
      elevation={3}
      square
    >
      <IconButton
        sx={{ position: "absolute", top: "10px", right: "10px" }}
        color="primary"
        onClick={async () => {
          const { jobSetups, newMaterialArray, newTotalProduced } =
            await addNewSetup(activeJob);
          updateActiveJob((prev) => ({
            ...prev,
            build: {
              ...prev.build,
              setup: jobSetups,
              materials: newMaterialArray,
              products: {
                ...prev.build.products,
                totalQuantity: newTotalProduced,
              },
            },
          }));
          setJobModified(true);
        }}
      >
        <AddIcon />
      </IconButton>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h6" align="center" color="primary">
            Build Setup
          </Typography>
        </Grid>
        <Grid container item xs={12} spacing={2} sx={{ marginTop: "20px" }}>
          {Object.values(activeJob.build.setup).map((setupEntry) => {
            return (
              <JobSetupCard
                key={setupEntry.id}
                setupEntry={setupEntry}
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                setJobModified={setJobModified}
                setupToEdit={setupToEdit}
                updateSetupToEdit={updateSetupToEdit}
              />
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}
