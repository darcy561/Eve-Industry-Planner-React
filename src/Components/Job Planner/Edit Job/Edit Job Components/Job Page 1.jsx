import React, { useContext } from "react";
import Select from "react-select";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { useCreateJobProcess } from "../../../../Hooks/useCreateJob";
import { blueprintVariables } from "../..";
import { jobTypes } from "../..";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import {
  Container,
  Grid,
  FormHelperText,
  Icon,
  IconButton,
  TextField,
  Typography,
  Button,
  Tooltip,
} from "@material-ui/core";
import { CalculateTotals } from "../../../../Hooks/useBlueprintCalc";
import { makeStyles } from "@material-ui/styles";


const useStyles = makeStyles((theme) => ({
}))


export function EditPage1({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { newJobProcess } = useCreateJobProcess();
  const classes = useStyles();

  function AddBuildIcon({ material }) {
    if (material.jobType === 1) {
      return (
        <Tooltip title="Click to add as a manufacturing job" placement="left-start">
          <IconButton
            className={classes.manIcon}
            style={{color: "rgba(164,219,45,0.5)"}}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    }
    else if (material.jobType === 2) {
      return (
        <Tooltip title="Click to add as a reaction job" placement="left-start">
          <IconButton
            style={{color: "rgba(219,45,164,0.5)"}}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    }
    else if (material.jobType === 3) {
      return (
        <Tooltip title="Planetary Interaction" placement="left-start">
          <Icon
            style={{color: "rgba(63,25,137,0.5)"}}
            fontSize="small"
          >
            <MdRemoveCircle/>
          </Icon>
        </Tooltip>
      );
    }
    else if(material.jobType === 0) {
      return (
        <Tooltip title="Base Material" placement="left-start">
          <Icon
            fontSize="small"
            color="primary"
          >
            <MdRemoveCircle/>
          </Icon>
        </Tooltip>
      )
    }
  }

  return (
    <Container maxWidth="xl" disableGutters={true}>
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
                  job: {
                    ...prevState.job,
                    products: {
                      ...prevState.job.products,
                      recalculate: true
                    }
                  }
                }));
                setJobModified(true);
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
                  job: {
                    ...prevState.job,
                    products: {
                      ...prevState.job.products,
                      recalculate: true
                    }
                  }
                }));
                setJobModified(true);
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
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true
                        }
                      }
                    }));
                    setJobModified(true);
                  }}
                  options={blueprintVariables.me}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Material Efficiecy
                </FormHelperText>
              </Grid>
              <Grid item sm={1} />
              <Grid item xs={12} sm={4}>
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
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true
                        }
                      }
                    }));
                    setJobModified(true);
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
                    if (e.value === "Station") {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        structureTypeDisplay: e.value,
                        structureType: 0,
                        job: {
                          ...prevState.job,
                          products: {
                            ...prevState.job.products,
                            recalculate: true
                          }
                        }
                      }));
                    } else {
                      updateActiveJob((prevState) => ({
                        ...prevState,
                        structureTypeDisplay: e.value,
                        structureType: 1,
                        job: {
                          ...prevState.job,
                          products: {
                            ...prevState.job.products,
                            recalculate: true
                          }
                        }
                      }));
                    }
                    setJobModified(true);
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
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true
                        }
                      }
                    }));
                    setJobModified(true);
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Structure Type
                </FormHelperText>
              </Grid>
            </>
          ) : null}

          <Grid item sm={1} />

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
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true
                        }
                      }
                    }));
                    setJobModified(true);
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
                      job: {
                        ...prevState.job,
                        products: {
                          ...prevState.job.products,
                          recalculate: true
                        }
                      }
                    }));
                    setJobModified(true);
                  }}
                />
                <FormHelperText style={{ color: "#fff" }}>
                  Rig Type
                </FormHelperText>
              </Grid>
            </>
          ) : null}

          <Grid item sm={1} />

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
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true
                      }
                    }
                  }));
                  setJobModified(true);
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
                    job: {
                      ...prevState.job,
                      products: {
                        ...prevState.job.products,
                        recalculate: true
                      }
                    }
                  }));
                  setJobModified(true);
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
                  <AddBuildIcon material={material} />
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
        {activeJob.job.products.recalculate === true ?(
        <Button
          variant="contained"
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
                  recalculate: false
                }
              },
            }));
            setJobModified(true);
          }}
        >
          Click to recalculate before continuing
      </Button>
        ): null}
      </Grid>
    </Container>
  );
}
