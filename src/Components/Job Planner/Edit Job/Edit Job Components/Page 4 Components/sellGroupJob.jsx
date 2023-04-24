import { Button, Grid, Tooltip } from "@mui/material";
import { useContext } from "react";
import { UserJobSnapshotContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function SellGroupJob({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { deleteJobSnapshot } = useJobManagement();

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

  return (
    <Grid
      container
      item
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="center">
        <Tooltip title="Sell" arrow placement="bottom">
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={toggleMarkForSell}
          >
            {activeJob.isReadyToSell ? "Not Ready For Sale" : "Ready For Sale"}
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
