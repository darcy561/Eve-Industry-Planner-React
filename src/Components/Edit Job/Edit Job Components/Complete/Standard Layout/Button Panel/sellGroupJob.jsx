import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { useJobSnapshotManagement } from "../../../../../../Hooks/JobHooks/useJobSnapshots";
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
  const { deleteJobSnapshot } = useJobSnapshotManagement();

  const toggleMarkForSell = async () => {
    if (!activeJob.isReadyToSell) {
      updateActiveJob((prev) => ({
        ...prev,
        jobStatus: prev.jobStatus + 1,
        isReadyToSell: !prev.isReadyToSell,
      }));
    } else {
      let newUserJobSnaoshot = deleteJobSnapshot(activeJob, [
        ...userJobSnapshot,
      ]);
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
