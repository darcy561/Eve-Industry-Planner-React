import { Button } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../../Context/JobContext";

export function MarkAsCompleteButton({ activeJob, setJobModified }) {
  const { groupArray, updateGroupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);

  const activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  function toggleMarkJobAsComplete() {
    const newGroupArray = [...groupArray];
    const group = newGroupArray.find((i) => i.groupID === activeGroup);

    const selectedMethod = group.areComplete.has(activeJob.jobID)
      ? group.removeAreComplete
      : group.addAreComplete;

    selectedMethod(activeJob.jobID);

    updateGroupArray(newGroupArray);
    setJobModified(true);
  }

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
      {activeGroupObject.areComplete.has(activeJob.jobID)
        ? "Mark As Incomplete"
        : "Mark As Complete"}
    </Button>
  );
}
