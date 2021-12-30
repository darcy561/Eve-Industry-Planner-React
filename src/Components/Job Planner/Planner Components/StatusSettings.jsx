import React, { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { JobStatusContext } from "../../../Context/JobContext";
import { useFirebase } from "../../../Hooks/useFirebase";

export function StatusSettings({
  statusData,
  updateStatusData,
  statusSettingsTrigger,
  updateStatusSettingsTrigger,
}) {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { updateMainUserDoc } = useFirebase();


  return (
    <Dialog open={statusSettingsTrigger} PaperProps={{sx:{padding: "15px"}}}>
      <DialogTitle align="center">Settings</DialogTitle>
      <Typography variant="body2">Name:</Typography>
      <TextField
        variant="standard"
        size="small"
        defaultValue={statusData.name}
        onChange={(e) => {
          updateStatusData((prev) => ({
            ...prev, name: e.target.value
          }));
        }}
      />
      <Typography variant="body2">Display Open API Jobs:</Typography>
      <Switch
        checked={statusData.openAPIJobs}
        color="primary"
        onChange={(e) => {
          updateStatusData((prev) => ({
            ...prev, openAPIJobs: e.target.checked
          }));
        }}
      />
      <Typography variant="body2">Display Complete API Jobs:</Typography>
      <Switch
        checked={statusData.completeAPIJobs}
        color="primary"
        onChange={(e) => {
          updateStatusData((prev) => ({
            ...prev, completeAPIJobs: e.target.checked
          }));
        }}
      />
      <DialogActions>
        <Button
          onClick={() => {
            updateStatusSettingsTrigger(false);
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            const index = jobStatus.findIndex((i) => i.id === statusData.id);
            const newStatusArray = jobStatus;
            newStatusArray[index] = statusData;
            setJobStatus(newStatusArray);
            updateMainUserDoc();
            updateStatusSettingsTrigger(false);

          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
