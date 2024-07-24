import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../../Context/JobContext";

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
      updateActiveJob((prev) => ({
        ...prev,
        jobStatus: prev.jobStatus + 1,
        isReadyToSell: !prev.isReadyToSell,
      }));
    } else {
      const newUserJobSnaoshot = userJobSnapshot.filter(
        (i) => i.jobID === activeJob.jobID
      );
      updateActiveJob((prev) => ({
        ...prev,
        isReadyToSell: !prev.isReadyToSell,
      }));
      updateUserJobSnapshot(newUserJobSnaoshot);
    }
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
