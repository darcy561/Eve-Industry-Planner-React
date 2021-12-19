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
import { CalculateTotals } from "../../../../../Hooks/useBlueprintCalc";

export function ManufacturingOptions({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);

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
                updateActiveJob((prevState) => ({
                  ...prevState,
                  runCount: Number(e.target.value),
                  job: {
                    ...prevState.job,
                    products: {
                      ...prevState.job.products,
                      recalculate: true,
                    },
                  },
                }));
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
                updateActiveJob((prevState) => ({
                  ...prevState,
                  jobCount: Number(e.target.value),
                  job: {
                    ...prevState.job,
                    products: {
                      ...prevState.job.products,
                      recalculate: true,
                    },
                  },
                }));
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
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    bpME: Number(v.value),
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true,
                      },
                    },
                  }));
                  setJobModified(true);
                }}
                options={blueprintVariables.me}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText>Material Efficiecy</FormHelperText>
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
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    bpTE: Number(v.value),
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true,
                      },
                    },
                  }));
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText>Time Efficiecy</FormHelperText>
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
                onChange={(event, value) => {
                  if (value.value === "Station") {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      structureTypeDisplay: value.value,
                      structureType: 0,
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true,
                        },
                      },
                    }));
                  } else {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      structureTypeDisplay: value.value,
                      structureType: 1,
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true,
                        },
                      },
                    }));
                  }
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
                defaultValue={blueprintVariables.manRigs.find(
                  (x) => x.value === activeJob.rigType
                )}
                disableClearable={true}
                options={blueprintVariables.manRigs}
                onChange={(event, value) => {
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    rigType: Number(value.value),
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true,
                      },
                    },
                  }));
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
                defaultValue={blueprintVariables.manSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.manSystem}
                onChange={(e, v) => {
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    systemType: Number(v.value),
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true,
                      },
                    },
                  }));
                  setJobModified(true);
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" />
                )}
              />
              <FormHelperText>System Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {activeJob.job.products.recalculate &&
              <Button
                size="small"
                
                color="primary"
                onClick={() => {
                  const updatedTotals = CalculateTotals(activeJob);
                  updateActiveJob((prevObj) => ({
                    ...prevObj,
                    job: {
                      ...prevObj.job,
                      materials: updatedTotals,
                      products: {
                        ...prevObj.job.products,
                        recalculate: false,
                      },
                    },
                  }));
                  setJobModified(true);
                }}
              >
                Click to recalculate before continuing
              </Button>}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
