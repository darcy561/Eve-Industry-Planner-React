import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../../Context/JobContext";
import Job from "../../../../../../Classes/jobConstructor";

export function SellGroupJobButton({
  activeJob,
  updateActiveJob,
  setJobModified,
}) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );

  const toggleMarkForSell = async () => {
    if (!activeJob.isReadyToSell) {
      activeJob.jobStatus += 1;
      activeJob.isReadyToSell = !activeJob.isReadyToSell;
    } else {
      const newUserJobSnaoshot = userJobSnapshot.filter(
        (i) => i.jobID === activeJob.jobID
      );
      activeJob.isReadyToSell = !activeJob.isReadyToSell;
      updateUserJobSnapshot(newUserJobSnaoshot);
    }
    updateActiveJob((prev) => new Job(prev));
    setJobModified(true);
  };

  if (!activeGroup || activeJob.parentJob.length !== 0) {
    return null;
  }

  return (
    <Tooltip title="Sell" arrow placement="bottom">
      <Button
        color="primary"
        variant="contained"
        size="small"
        onClick={toggleMarkForSell}
        sx={{ margin: "10px" }}
        disabled={activeJob.isReadyToSell}
      >
        {activeJob.isReadyToSell ? "Not Ready For Sale" : "Ready For Sale"}
      </Button>
    </Tooltip>
  );
}
