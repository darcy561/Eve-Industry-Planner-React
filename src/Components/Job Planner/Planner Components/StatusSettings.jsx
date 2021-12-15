import React, { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
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
    <Dialog open={statusSettingsTrigger}>
      <DialogTitle>Settings</DialogTitle>
      <Typography variant="body1">Name:</Typography>
      <TextField
        autoFocus={true}
        defaultValue={statusData.name}
        onChange={(e) => {
          updateStatusData((prev) => ({
            ...prev, name: e.target.value
          }));
        }}
        variant="outlined"
      />
      <Typography variant="body1">Display Open API Jobs:</Typography>
      <Switch
        checked={statusData.openAPIJobs}
        color="primary"
        onChange={(e) => {
          updateStatusData((prev) => ({
            ...prev, openAPIJobs: e.target.checked
          }));
        }}
      />
      <Typography variant="body1">Display Complete API Jobs:</Typography>
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
