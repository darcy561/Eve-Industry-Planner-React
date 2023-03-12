import { Button, Grid } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function MarkAsCompleteButton({ setJobModified }) {
  const { activeJob, activeGroup, updateActiveGroup } =
    useContext(ActiveJobContext);

  const toggleMarkJobAsComplete = () => {
    let newAreComplete = new Set(activeGroup.areComplete);

    if (newAreComplete.has(activeJob.jobID)) {
      newAreComplete.delete(activeJob.jobID);
    } else {
      newAreComplete.add(activeJob.jobID);
    }

    updateActiveGroup((prev) => ({
      ...prev,
      areComplete: [...newAreComplete],
    }));
    setJobModified(true);
  };

  return (
    <Grid
      container
      item
      xs={12}
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="center">
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={toggleMarkJobAsComplete}
        >
          {activeGroup.areComplete.includes(activeJob.jobID)
            ? "Mark As Incomplete"
            : "Mark As Complete"}
        </Button>
      </Grid>
    </Grid>
  );
}
