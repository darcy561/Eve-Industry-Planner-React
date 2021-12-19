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

export function ReactionOptions({ setJobModified }) {
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
                size="small"
                defaultValue={blueprintVariables.reactionStructure.find(
                  (x) => x.value === activeJob.structureTypeDisplay
                )}
                disableClearable={true}
                options={blueprintVariables.reactionStructure}
                onChange={(e, v) => {
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    structureTypeDisplay: v.value,
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
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    rigType: Number(v.value),
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
                defaultValue={blueprintVariables.reactionSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.reactionSystem}
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
            {activeJob.job.products.recalculate && (
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
              </Button>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
