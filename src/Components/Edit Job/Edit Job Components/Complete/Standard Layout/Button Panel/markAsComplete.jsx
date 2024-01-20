import { Button } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../Context/JobContext";

export function MarkAsCompleteButton({ activeJob, setJobModified }) {
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);

  const toggleMarkJobAsComplete = () => {
    const newGroupArray = [...groupArray];
    let selectedJob = newGroupArray.find((i) => i.groupID === activeGroup);

    const newAreComplete = new Set(selectedJob.areComplete);
    newAreComplete[newAreComplete.has(activeJob.jobID) ? "delete" : "add"](
      activeJob.jobID
    );
    selectedJob.areComplete = [...newAreComplete];
    updateGroupArray(newGroupArray);
    setJobModified(true);
  };
  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

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
      {activeGroupObject.areComplete.includes(activeJob.jobID)
        ? "Mark As Incomplete"
        : "Mark As Complete"}
    </Button>
  );
}
