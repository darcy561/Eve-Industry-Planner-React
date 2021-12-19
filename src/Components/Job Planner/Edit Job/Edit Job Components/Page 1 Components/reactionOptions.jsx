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

export function ReactionOptions({ setJobModified }) {
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
              onChange={(e) => {
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
                size="small"
                defaultValue={blueprintVariables.reactionStructure.find(
                  (x) => x.value === activeJob.structureTypeDisplay
                )}
                disableClearable={true}
                options={blueprintVariables.reactionStructure}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob))
                  oldJob.structureTypeDisplay = v.value
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText>Structure Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                size="small"
                defaultValue={blueprintVariables.reactionRigs.find(
                  (x) => x.value === activeJob.rigType
                )}
                disableClearable={true}
                options={blueprintVariables.reactionRigs}
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
              <FormHelperText>Rig Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.reactionSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.reactionSystem}
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
              <FormHelperText>System Type</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
