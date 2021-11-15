import React, { useContext } from "react";
import Select from "react-select";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { useCreateJobProcess } from "../../../Hooks/useCreateJob";
import { blueprintVariables } from "../..";
import { jobTypes } from "../..";
import { MdAdd } from "react-icons/md";
import {
  Container,
  Grid,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
  Button,
  Tooltip,
} from "@material-ui/core";
import { CalculateTotals } from "../../../Hooks/useBlueprintCalc";

// const customStyles = {
//   container: (provided, state) => ({
//     ...provided,
//     // width: `50%`,
//   }),
//   control: (provided, state) => ({
//     ...provided,
//     width: `50%`,
//     backgroundColor: `#4e4a4a`,
//     boxShadow: state.isSelected ? `none` : ``,
//     border: `none`,
//     "&:hover": {
//       borderColor: `rgba(219,160,45)`,
//     },
//   }),
//   placeholder: (provided, state) => ({
//     ...provided,
//     color: `#E0E0E0`,
//     fontWeight: `normal`,
//   }),
//   menu: (provided, state) => ({
//     ...provided,
//     width: `50%`,
//     backgroundColor: `#4e4a4a`,
//   }),
//   option: (provided, state) => ({
//     ...provided,
//     color: state.isFocused ? `rgba(219,160,45)` : ``,
//     backgroundColor: state.isFocused ? `rgba(224,224,224,0.25)` : ``,
//     fontWeight: state.isFocused ? `bold` : ``,
//   }),
//   singleValue: () => ({
//     color: `#E0E0E0`,
//   }),
//   indicatorSeparator: () => ({
//     display: `none`,
//   }),
//   dropdownIndicator: (provided, state) => ({
//     ...provided,
//     color: state.isFocused ? `rgba(219,160,45)` : ``,
//     "&:hover": {
//       color: `rgba(219,160,45)`,
//     },
//   }),
// };

export function EditPage1() {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [newJobProcess] = useCreateJobProcess();

  return (
    <Container maxWidth={false} disableGutters={true}>
      <Grid container item xs={12} direction="row">
        <Grid container item xs={12} sm={4} direction="row">
          <Grid item xs={12} sm={4}>
            <TextField
              defaultValue={activeJob.runCount}
              variant="outlined"
              helperText="Blueprint Runs"
              type="number"
              onBlur={(e) => {
                updateActiveJob((prevState) => ({
                  ...prevState,
                  runCount: Number(e.target.value),
                }));
              }}
            />
          </Grid>
          <Grid item sm={1} />
          <Grid item xs={12} sm={4}>
            <TextField
              defaultValue={activeJob.jobCount}
              variant="outlined"
              helperText="Job Slots"
              type="number"
              onBlur={(e) => {
                updateActiveJob((prevState) => ({
                  ...prevState,
                  jobCount: Number(e.target.value),
                }));
              }}
            />
          </Grid>
          <Grid item sm={3} />

          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
              <Grid item xs={12} sm={4}>
                <Select
                  variant="outlined"
                  defaultValue={blueprintVariables.me.find(
                    (x) => x.value === activeJob.bpME
                  )}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      bpME: Number(e.value),
                    }));
                  }}
                  options={blueprintVariables.me}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Material Efficiecy
                </FormHelperText>
              </Grid>
              <Grid sm={1} />
              <Grid xs={12} sm={4}>
                <Select
                  variant="outlined"
                  value={blueprintVariables.te.find(
                    (x) => x.value === activeJob.bpTE
                  )}
                  options={blueprintVariables.te}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      bpTE: Number(e.value),
                    }));
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Time Efficiecy
                </FormHelperText>
              </Grid>
              <Grid item sm={3} />
            </>
          ) : null}

          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
              <Grid item xs={12} sm={3}>
                <Select
                  variant="outlined"
                  value={blueprintVariables.manStructure.find(
                    (x) => x.value === activeJob.structureTypeDisplay
                  )}
                  options={blueprintVariables.manStructure}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      structureTypeDisplay: e.value,
                    }));
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Structure Type
                </FormHelperText>
              </Grid>
            </>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <>
              <Grid item xs={12} sm={3}>
                <Select
                  variant="outlined"
                  value={blueprintVariables.reactionStructure.find(
                    (x) => x.value === activeJob.structureTypeDisplay
                  )}
                  options={blueprintVariables.reactionStructure}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      structureTypeDisplay: e.value,
                    }));
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Structure Type
                </FormHelperText>
              </Grid>
            </>
          ) : null}

          <Grid sm={1} />

          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
              <Grid item xs={12} sm={3}>
                <Select
                  variant="outlined"
                  value={blueprintVariables.manRigs.find(
                    (x) => x.value === activeJob.rigType
                  )}
                  options={blueprintVariables.manRigs}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      rigType: Number(e.value),
                    }));
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Rig Type
                </FormHelperText>
              </Grid>
            </>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <>
              <Grid item xs={12} sm={3}>
                <Select
                  variant="outlined"
                  value={blueprintVariables.reactionRigs.find(
                    (x) => x.value === activeJob.rigType
                  )}
                  options={blueprintVariables.reactionRigs}
                  onChange={(e) => {
                    updateActiveJob((prevState) => ({
                      ...prevState,
                      rigType: Number(e.value),
                    }));
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Rig Type
                </FormHelperText>
              </Grid>
            </>
          ) : null}

          <Grid sm={1} />

          {activeJob.jobType === jobTypes.manufacturing ? (
            <Grid item xs={12} sm={3}>
              <Select
                variant="outlined"
                value={blueprintVariables.manSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.manSystem}
                onChange={(e) => {
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    systemType: Number(e.value),
                  }));
                }}
              />
              <FormHelperText style={{ color: "#fff" }}>
                System Type
              </FormHelperText>
            </Grid>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <Grid item xs={12} sm={3}>
              <Select
                variant="outlined"
                value={blueprintVariables.reactionSystem.find(
                  (x) => x.value === activeJob.systemType
                )}
                options={blueprintVariables.reactionSystem}
                onChange={(e) => {
                  updateActiveJob((prevState) => ({
                    ...prevState,
                    systemType: Number(e.value),
                  }));
                }}
              />
              <FormHelperText style={{ color: "#fff" }}>
                System Type
              </FormHelperText>
            </Grid>
          ) : null}
        </Grid>
        <Grid container item xs={12} sm={8} direction="row">
          <Grid item xs={2} />
          <Grid item xs={8}>
            <Typography variant="h5">Raw Resources</Typography>
          </Grid>
          <Grid item xs={2} />
          {activeJob.job.materials.map((material) => {
            return (
              <Grid item container xs={12}>
                <Grid key={material.typeID} item xs={1} sm={1}>
                  <Tooltip title="Click to add as a job" placement="left-start">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() =>
                        newJobProcess(material.typeID, material.quantity)
                      }
                    >
                      <MdAdd />
                    </IconButton>
                  </Tooltip>
                </Grid>
                <Grid item xs={8} sm={6}>
                  <Typography variant="body2">{material.name}</Typography>
                </Grid>
                <Grid item xs={3} sm={5}>
                  <Typography variant="body2">
                    {material.quantity.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            const updatedTotals = CalculateTotals(activeJob);
            updateActiveJob((prevObj) => ({
              ...prevObj,
              job: { ...prevObj.job, materials: updatedTotals },
            }));
          }}
        >
          Recalculate Totals
        </Button>
      </Grid>
    </Container>
  );
};