import { Button } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../../Context/JobContext";

export function MarkAsCompleteButton({ activeJob, setJobModified }) {
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);

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

  if (!activeGroup) {
    return null;
  }

  return (
    <Button
      color="primary"
      variant="contained"
      size="small"
      onClick={toggleMarkJobAsComplete}
      sx={{ margin: "10px" }}
    >
      {activeGroup.areComplete.includes(activeJob.jobID)
        ? "Mark As Incomplete"
        : "Mark As Complete"}
    </Button>
  );
}
