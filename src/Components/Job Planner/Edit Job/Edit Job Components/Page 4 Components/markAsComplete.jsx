import { Button, Grid } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function MarkAsCompleteButton({ setJobModified }) {
  const { activeJob, activeGroup, updateActiveGroup } =
    useContext(ActiveJobContext);

  const toggleMarkJobAsComplete = () => {
    updateActiveGroup((prev) => {
      const newAreComplete = new Set(prev.areComplete);
      newAreComplete[newAreComplete.has(activeJob.jobID) ? "delete" : "add"](
        activeJob.jobID
      );
      return {
        ...prev,
        areComplete: [...newAreComplete],
      };
    });
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
