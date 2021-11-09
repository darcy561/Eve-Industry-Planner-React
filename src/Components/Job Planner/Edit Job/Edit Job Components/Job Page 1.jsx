import React, { useContext } from "react";
import Select from "react-select";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../Context/JobContext";
import { blueprintVariables } from "../..";
import { jobTypes } from "../..";
import { createJob } from "../../JobBuild";
import { MdAdd } from "react-icons/md";
import {
  Container,
  Grid,
  FormHelperText,
  IconButton,
  TextField,
  Typography,
  Button,
} from "@material-ui/core";
import { CalculateTotals } from "../blueprintCalcs";

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
  const { updateJobArray } = useContext(JobArrayContext);

  async function createJobFromEdit(itemID, itemQty) {
    try {
      const newJob = await createJob(itemID);
      switch (newJob.jobType) {
        case 1:
          newJob.jobCount = Math.ceil(
            itemQty /
              (newJob.maxProductionLimit *
                newJob.manufacturing.products[0].quantity)
          );
          newJob.runCount = Math.ceil(
            itemQty /
              newJob.manufacturing.products[0].quantity /
              newJob.jobCount
          );
          break;
        case 2:
          newJob.jobCount = Math.ceil(
            itemQty /
              (newJob.maxProductionLimit * newJob.reaction.products[0].quantity)
          );
          newJob.runCount = Math.ceil(
            itemQty / newJob.reaction.products[0].quantity / newJob.jobCount
          );
          break;
      }
      updateJobArray((prevArray) => [...prevArray, newJob]);
    } catch (err) {}
  }

  return (
    <Container>
      <Grid container direction="row">
      <Grid item sm={3} md={4}></Grid>
        <Grid item xs={5} sm={2} md={1}>
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
        <Grid item xs={2} sm={2} md={2}></Grid>
        <Grid item xs={5} sm={2} md={1}>
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
        <Grid item sm={3} md={4}></Grid>
        {activeJob.jobType === jobTypes.manufacturing ? (
          <>
            <Grid item sm={3} md={3}></Grid>
            <Grid item xs={5} sm={2} md={2}>
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
            <Grid item xs={2} sm={2} md={2}></Grid>
            <Grid item xs={5} sm={2} md={2}>
              
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
            <Grid item sm={3} md={3}></Grid>
          </>
        ) : (
          <></>
        )}
        <Grid item sm={1} md={2}></Grid>
        <Grid item xs={5} sm={2} md={2}>
          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
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
            </>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <>
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
            </>
          ) : (
            <></>
          )}
        </Grid>
        <Grid item xs={2} sm={2} md={1}></Grid>
        <Grid item xs={5} sm={2} md={2}>
          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
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
            </>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <>
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
            </>
          ) : (
            <></>
          )}
        </Grid>
        <Grid item sm={2} md={1}></Grid>
        <Grid item xs={5} sm={2} md={2}>
          {activeJob.jobType === jobTypes.manufacturing ? (
            <>
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
            </>
          ) : activeJob.jobType === jobTypes.reaction ? (
            <>
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
            </>
          ) : (
            <></>
          )}
        </Grid>
        <Grid item sm={1} md={2}></Grid>

        <Grid item xs={12}>
          <Typography variant="h5">Raw Resources</Typography>
        </Grid>
        <Grid container direction="row">
        {activeJob.job.materials.map((material) => {
          return (
            <>
              <Grid item xs={2} sm={1}>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={()=> createJobFromEdit(material.typeID, material.quantity)}
                >
              <MdAdd />
              </IconButton>
            </Grid>
            <Grid item xs={6} sm={7}><Typography variant="body2">{material.name}</Typography></Grid>
            <Grid item xs={4} sm={4}><Typography variant="body2">{material.quantity.toLocaleString()}</Typography></Grid>
            </>
          );
        })}
        </Grid>
        <Grid item xs={6} sm={2}><Button variant="contained" color="primary"  onClick={() => {
          const updatedTotals = CalculateTotals(activeJob);
          updateActiveJob(prevObj => ({ ...prevObj, job: { ...prevObj.job, materials: updatedTotals } }))
        }}>Calculate Totals</Button>
        </Grid>
      </Grid>
    </Container>
  );
}