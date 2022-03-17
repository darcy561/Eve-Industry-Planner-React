import {
  Autocomplete,
  Grid,
  FormControl,
  FormHelperText,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Select,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { blueprintVariables } from "../../..";
import { useBlueprintCalc } from "../../../../../Hooks/useBlueprintCalc";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
  Autocomplete: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
  },
}));

export function ManufacturingOptions({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { CalculateResources } = useBlueprintCalc();
  const classes = useStyles();

  const parentUser = users.find((i) => i.ParentUser === true);

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
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
              className={classes.TextField}
              helperText="Blueprint Runs"
              type="number"
              onBlur={(e) => {
                const oldJob = JSON.parse(JSON.stringify(activeJob));
                oldJob.runCount = Number(e.target.value);
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
              className={classes.TextField}
              helperText="Job Slots"
              type="number"
              onBlur={(e) => {
                const oldJob = JSON.parse(JSON.stringify(activeJob));
                oldJob.jobCount = Number(e.target.value);
                const newJob = CalculateResources(oldJob);
                updateActiveJob(newJob);
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl className={classes.TextField} fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.me.find(
                  (x) => x.value === activeJob.bpME
                )}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.bpME = Number(v.value);
                  const newJob = CalculateResources(oldJob);
                  updateActiveJob(newJob);
                  setJobModified(true);
                }}
                options={blueprintVariables.me}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText variant="standard">
                Material Efficiecy
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <Tooltip
              title="Calculations are not currently implemented, added for reference."
              arrow
              placement="top"
            >
              <FormControl className={classes.TextField} fullWidth={true}>
                <Autocomplete
                  disableClearable={true}
                  size="small"
                  defaultValue={blueprintVariables.te.find(
                    (x) => x.value === activeJob.bpTE
                  )}
                  options={blueprintVariables.te}
                  onChange={(e, v) => {
                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.bpTE = Number(v.value);
                    const newJob = CalculateResources(oldJob);
                    updateActiveJob(newJob);
                    setJobModified(true);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} variant="standard" />
                  )}
                />
                <FormHelperText variant="standard">
                  Time Efficiecy
                </FormHelperText>
              </FormControl>
            </Tooltip>
          </Grid>
          <Grid item xs={6}>
            <FormControl className={classes.TextField} fullWidth={true}>
              <Autocomplete
                size="small"
                defaultValue={blueprintVariables.manStructure.find(
                  (x) => x.value === activeJob.structureTypeDisplay
                )}
                disableClearable={true}
                options={blueprintVariables.manStructure}
                onChange={(e, v) => {
                  if (v.value === "Station") {
                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.structureTypeDisplay = v.value;
                    oldJob.structureType = 0;
                    const newJob = CalculateResources(oldJob);
                    updateActiveJob(newJob);
                  } else {
                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.structureTypeDisplay = v.value;
                    oldJob.structureType = 1;
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
            <FormControl className={classes.TextField} fullWidth={true}>
              <Autocomplete
                size="small"
                defaultValue={blueprintVariables.manRigs.find(
                  (x) => x.value === activeJob.rigType
                )}
                disableClearable={true}
                options={blueprintVariables.manRigs}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.rigType = Number(v.value);
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
            <FormControl className={classes.TextField} fullWidth={true}>
              <Autocomplete
                disableClearable={true}
                size="small"
                defaultValue={blueprintVariables.manSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.manSystem}
                onChange={(e, v) => {
                  const oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.systemType = Number(v.value);
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
          {isLoggedIn && (
            <Grid item xs={12}>
              <FormControl className={classes.TextField} fullWidth={true}>
                <Select
                  variant="standard"
                  size="small"
                  renderValue={(selected) =>
                    selected.map((item) => item.name).join(", ")
                  }
                  value=""
                  onChange={(e) => {
                    const structure =
                      parentUser.settings.structures.manufacturing.find(
                        (i) => i.id === e.target.value
                      );
                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.rigType = structure.rigType;
                    oldJob.systemType = structure.systemType;
                    oldJob.structureType = structure.structureValue;
                    oldJob.structureTypeDisplay = structure.structureName;
                    const newJob = CalculateResources(oldJob);
                    updateActiveJob(newJob);
                    setJobModified(true);
                  }}
                >
                  {parentUser.settings.structures.manufacturing.map((entry) => {
                    return (
                      <MenuItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Apply Saved Structure
                </FormHelperText>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
