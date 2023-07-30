import {
  Grid,
  FormControl,
  FormHelperText,
  MenuItem,
  Paper,
  TextField,
  Select,
  Tooltip,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { structureOptions } from "../../../../../Context/defaultValues";
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
}));

export function ReactionOptions({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const parentUser = users.find((i) => i.ParentUser);
  const [buildCharName, updateBuildCharName] = useState(() => {
    let charEntry = users.find(
      (i) => i.CharacterHash === activeJob.build.buildChar
    );
    if (charEntry === undefined) {
      return parentUser.CharacterHash;
    } else {
      return activeJob.build.buildChar;
    }
  });
  const [structValue, updateStructValue] = useState(activeJob.structureType);
  const [rigsValue, updateRigsValue] = useState(activeJob.rigType);
  const [systemValue, updateSystemValue] = useState(activeJob.systemType);
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const classes = useStyles();

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
          <Grid item xs={12} xl={8}>
            <FormControl className={classes.TextField} fullWidth={true}>
              <Select
                variant="standard"
                size="small"
                value={buildCharName}
                onChange={(e) => {
                  setJobModified(true);
                  updateBuildCharName(e.target.value);
                  updateActiveJob((prev) => ({
                    ...prev,
                    build: {
                      ...prev.build,
                      buildChar: e.target.value,
                      time: CalculateTime({
                        jobType: prev.jobType,
                        CharacterHash: e.target.value,
                        structureType: prev.structureType,
                        rigType: prev.rigType,
                        runCount: prev.runCount,
                        bpTE: prev.bpTE,
                        rawTime: prev.rawData.time,
                        skills: prev.skills,
                      }),
                    },
                  }));
                }}
              >
                {users.map((user) => {
                  return (
                    <MenuItem
                      key={user.CharacterHash}
                      value={user.CharacterHash}
                    >
                      {user.CharacterName}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">Use Character</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              defaultValue={activeJob.runCount}
              className={classes.TextField}
              size="small"
              variant="standard"
              helperText="Blueprint Runs"
              type="number"
              onBlur={(e) => {
                updateActiveJob((prev) => ({
                  ...prev,
                  runCount: Number(e.target.value),
                  build: {
                    ...prev.build,
                    materials: CalculateResources({
                      jobType: prev.jobType,
                      rawMaterials: prev.rawData.materials,
                      outputMaterials: prev.build.materials,
                      runCount: Number(e.target.value),
                      jobCount: prev.jobCount,
                      bpME: prev.bpME,
                      structureType: prev.structureType,
                      rigType: prev.rigType,
                      systemType: prev.systemType,
                    }),
                    products: {
                      ...prev.build.products,
                      totalQuantity:
                        prev.rawData.products[0].quantity *
                        Number(e.target.value) *
                        prev.jobCount,
                      quantityPerJob:
                        prev.rawData.products[0].quantity *
                        Number(e.target.value),
                    },
                    time: CalculateTime({
                      jobType: prev.jobType,
                      CharacterHash: prev.build.buildChar,
                      structureType: prev.structureType,
                      rigType: prev.rigType,
                      runCount: Number(e.target.value),
                      bpTE: prev.bpTE,
                      rawTime: prev.rawData.time,
                      skills: prev.skills,
                    }),
                  },
                }));
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              defaultValue={activeJob.jobCount}
              className={classes.TextField}
              size="small"
              variant="standard"
              helperText="Job Slots"
              type="number"
              onBlur={(e) => {
                updateActiveJob((prev) => ({
                  ...prev,
                  jobCount: Number(e.target.value),
                  build: {
                    ...prev.build,
                    materials: CalculateResources({
                      jobType: prev.jobType,
                      rawMaterials: prev.rawData.materials,
                      outputMaterials: prev.build.materials,
                      runCount: prev.runCount,
                      jobCount: Number(e.target.value),
                      bpME: prev.bpME,
                      structureType: prev.structureType,
                      rigType: prev.rigType,
                      systemType: prev.systemType,
                    }),
                    products: {
                      ...prev.build.products,
                      totalQuantity:
                        prev.rawData.products[0].quantity *
                        prev.runCount *
                        Number(e.target.value),
                      quantityPerJob:
                        prev.rawData.products[0].quantity * prev.runCount,
                    },
                  },
                }));
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <Tooltip
              title={
                <span>
                  <p>Medium: Astrahus, Athanor, Raitaru</p>
                  <p>Large: Azbel, Fortizar, Tatara</p>
                </span>
              }
              arrow
              placement={"top"}
            >
              <FormControl className={classes.TextField} fullWidth={true}>
                <Select
                  variant="standard"
                  size="small"
                  value={structValue}
                  onChange={(e) => {
                    updateStructValue(e.target.value);
                    updateActiveJob((prev) => ({
                      ...prev,
                      structureType: e.target.value,
                      build: {
                        ...prev.build,
                        materials: CalculateResources({
                          jobType: prev.jobType,
                          rawMaterials: prev.rawData.materials,
                          outputMaterials: prev.build.materials,
                          runCount: prev.runCount,
                          jobCount: prev.jobCount,
                          bpME: prev.bpME,
                          structureType: e.target.value,
                          rigType: prev.rigType,
                          systemType: prev.systemType,
                        }),
                        time: CalculateTime({
                          jobType: prev.jobType,
                          CharacterHash: prev.build.buildChar,
                          structureType: e.target.value,
                          rigType: prev.rigType,
                          runCount: prev.runCount,
                          bpTE: prev.bpTE,
                          rawTime: prev.rawData.time,
                          skills: prev.skills,
                        }),
                      },
                    }));
                  }}
                >
                  {Object.values(structureOptions.reactionStructure).map((entry) => {
                    return (
                      <MenuItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Structure Type
                </FormHelperText>
              </FormControl>
            </Tooltip>
          </Grid>
          <Grid item xs={6}>
            <FormControl className={classes.TextField} fullWidth={true}>
              <Select
                variant="standard"
                size="small"
                value={rigsValue}
                onChange={(e) => {
                  updateRigsValue(e.target.value);
                  updateActiveJob((prev) => ({
                    ...prev,
                    rigType: e.target.value,
                    build: {
                      ...prev.build,
                      materials: CalculateResources({
                        jobType: prev.jobType,
                        rawMaterials: prev.rawData.materials,
                        outputMaterials: prev.build.materials,
                        runCount: prev.runCount,
                        jobCount: prev.jobCount,
                        bpME: prev.bpME,
                        structureType: prev.structureType,
                        rigType: e.target.value,
                        systemType: prev.systemType,
                      }),
                      time: CalculateTime({
                        jobType: prev.jobType,
                        CharacterHash: prev.build.buildChar,
                        structureType: prev.structureType,
                        rigType: e.target.value,
                        runCount: prev.runCount,
                        bpTE: prev.bpTE,
                        rawTime: prev.rawData.time,
                        skills: prev.skills,
                      }),
                    },
                  }));
                  setJobModified(true);
                }}
              >
                {Object.values(structureOptions.reactionRigs).map((entry) => {
                  return (
                    <MenuItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">Rig Type</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl className={classes.TextField} fullWidth={true}>
              <Select
                variant="standard"
                size="small"
                value={systemValue}
                onChange={(e) => {
                  updateSystemValue(e.target.value);
                  updateActiveJob((prev) => ({
                    ...prev,
                    systemType: e.target.value,
                    build: {
                      ...prev.build,
                      materials: CalculateResources({
                        jobType: prev.jobType,
                        rawMaterials: prev.rawData.materials,
                        outputMaterials: prev.build.materials,
                        runCount: prev.runCount,
                        jobCount: prev.jobCount,
                        bpME: prev.bpME,
                        structureType: prev.structureType,
                        rigType: prev.rigType,
                        systemType: e.target.value,
                      }),
                    },
                  }));
                  setJobModified(true);
                }}
              >
                {Object.values(structureOptions.reactionSystem).map((entry) => {
                  return (
                    <MenuItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </MenuItem>
                  );
                })}
              </Select>
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
                  onChange={(e, v) => {
                    const structure =
                      parentUser.settings.structures.reaction.find(
                        (i) => i.id === e.target.value
                      );
                    updateActiveJob((prev) => ({
                      ...prev,
                      rigType: structure.rigType,
                      systemType: structure.systemType,
                      structureType: structure.structureType,
                      build: {
                        ...prev.build,
                        materials: CalculateResources({
                          jobType: prev.jobType,
                          rawMaterials: prev.rawData.materials,
                          outputMaterials: prev.build.materials,
                          runCount: prev.runCount,
                          jobCount: prev.jobCount,
                          bpME: prev.bpME,
                          structureType: structure.structureType,
                          rigType: structure.rigType,
                          systemType: structure.systemType,
                        }),
                        time: CalculateTime({
                          jobType: prev.jobType,
                          CharacterHash: prev.build.buildChar,
                          structureType: structure.structureType,
                          rigType: structure.rigType,
                          runCount: prev.runCount,
                          bpTE: prev.bpTE,
                          rawTime: prev.rawData.time,
                          skills: prev.skills,
                        }),
                      },
                    }));
                    setJobModified(true);
                  }}
                >
                  {parentUser.settings.structures.reaction.map((entry) => {
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
