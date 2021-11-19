import React, { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  TextField,
  Typography,
} from "@material-ui/core";
import { JobStatusContext } from "../../../Context/JobContext";
import { StatusSettingsTriggerContext } from "../../../Context/LayoutContext";
import { useFirebase } from "../../../Hooks/useFirebase";

export function StatusSettings() {
  const { jobStatus, setJobStatus } = useContext(JobStatusContext);
  const { statusSettingsTrigger, updateStatusSettingsTrigger } = useContext(
    StatusSettingsTriggerContext
  );
  const { uploadJobStatus } = useFirebase();

  const status = jobStatus.find((stat) => stat.id === statusSettingsTrigger.id);

  return (
    <Dialog open={statusSettingsTrigger.display}>
      <DialogTitle>{status.name} Settings</DialogTitle>
      <Typography variant="body1">Name:</Typography>
      <TextField
        autoFocus={true}
        defaultValue={status.name}
        onChange={(e) => {
          status.name = e.target.value;
        }}
        variant="outlined"
      ></TextField>
      <DialogActions>
        <Button
          onClick={() => {
            const index = jobStatus.findIndex((i) => i.id === status.id);
            const newStatusArray = jobStatus;
            newStatusArray[index] = status;
            uploadJobStatus(newStatusArray);
            setJobStatus(newStatusArray);
            updateStatusSettingsTrigger({ id: 0, display: false });
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
