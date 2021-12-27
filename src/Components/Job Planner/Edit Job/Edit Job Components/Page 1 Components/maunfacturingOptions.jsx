import {
  Autocomplete,
  Button,
  Grid,
  FormControl,
  FormHelperText,
  Paper,
  TextField,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { blueprintVariables } from "../../..";
import { useBlueprintCalc } from "../../../../../Hooks/useBlueprintCalc";

export function ManufacturingOptions({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { CalculateResources } = useBlueprintCalc();

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "20px",
        margin: "10px",
      }}
      square={true}
    >
      <Grid container direction="column">
        <Grid item container direction="row" spacing={2}>
          <Grid item xs={6}>
            <TextField
              defaultValue={activeJob.runCount}
              size="small"
              variant="standard"
              helperText="Blueprint Runs"
              type="number"
              onBlur={(e) => {
                const oldJob = JSON.parse(JSON.stringify(activeJob))
                oldJob.runCount = Number(e.target.value)
                const newJob = CalculateResources(oldJob);
                updateActiveJob(newJob);
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              defaultValue={activeJob.jobCount}
              size="small"
              variant="standard"
              helperText="Job Slots"
              type="number"
              onBlur={(e) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.jobCount = Number(e.target.value)
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.me.find(
                  (x) => x.value === activeJob.bpME
                )}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.bpME = Number(v.value)
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                options={blueprintVariables.me}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">Material Efficiecy</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.te.find(
                  (x) => x.value === activeJob.bpTE
                )}
                options={blueprintVariables.te}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.bpTE = Number(v.value)
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">Time Efficiecy</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                size="small"
                defaultValue={blueprintVariables.manStructure.find(
                  (x) => x.value === activeJob.structureTypeDisplay
                )}
                disableClearable={true}
                options={blueprintVariables.manStructure}
                onChange={(e, v) => {
                  if (v.value === "Station") {
                    const oldJob = JSON.parse(JSON.stringify(activeJob))
                    oldJob.structureTypeDisplay = v.value
                    oldJob.structureType = 0
                    const newJob = CalculateResources(oldJob);
                    updateActiveJob(newJob);
                  } else {
                    const oldJob = JSON.parse(JSON.stringify(activeJob))
                    oldJob.structureTypeDisplay = v.value
                    oldJob.structureType = 1
                    const newJob = CalculateResources(oldJob);
                    updateActiveJob(newJob);
                  }
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">Structure Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                size="small"
                defaultValue={blueprintVariables.manRigs.find(
                  (x) => x.value === activeJob.rigType
                )}
                disableClearable={true}
                options={blueprintVariables.manRigs}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.rigType = Number(v.value)
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">Rig Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.manSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.manSystem}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.systemType = Number(v.value)
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">System Type</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
