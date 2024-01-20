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
  CircularProgress,
} from "@mui/material";
import React, { useContext, useMemo, useState } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";

import {
  blueprintOptions,
  structureOptions,
} from "../../../../../../Context/defaultValues";
import { jobTypes } from "../../../../../../Context/defaultValues";
import systemIDS from "../../../../../../RawData/systems.json";
import { useUpdateSetupValue } from "../../../../../../Hooks/JobHooks/useUpdateSetupValue";

export function EditJobSetup({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { recalcuateJobFromSetup } = useUpdateSetupValue();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  if (!activeJob.build.setup[setupToEdit]) return null;

  let buildObject = activeJob.build.setup[setupToEdit];

  const [runCountInput, updateRunCountInput] = useState(buildObject.runCount);
  const [jobCountInput, updateJobCountInput] = useState(buildObject.jobCount);

  const customStructureMap = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };

  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: "20px",
      }}
      square
    >
      <Grid container direction="column">
        <Grid item container direction="row" spacing={2}>
          <Grid item xs={6}>
            <TextField
              value={runCountInput}
              size="small"
              variant="standard"
              helperText="Blueprint Runs"
              type="number"
              sx={{
                "& .MuiFormHelperText-root": {
                  color: (theme) => theme.palette.secondary.main,
                },
                "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                  {
                    display: "none",
                  },
              }}
              onChange={(e) => {
                updateRunCountInput(e.target.value);
              }}
              onBlur={(e) => {
                let valueToPass = Number(runCountInput);
                if (valueToPass <= 0) {
                  valueToPass = 1;
                }
                recalcuateJobFromSetup(
                  buildObject,
                  "runCount",
                  valueToPass,
                  undefined,
                  activeJob,
                  updateActiveJob,
                  false
                );
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              value={jobCountInput}
              size="small"
              variant="standard"
              sx={{
                "& .MuiFormHelperText-root": {
                  color: (theme) => theme.palette.secondary.main,
                },
                "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                  {
                    display: "none",
                  },
              }}
              helperText="Job Slots"
              type="number"
              onChange={(e) => {
                updateJobCountInput(e.target.value);
              }}
              onBlur={(e) => {
                let valueToPass = Number(jobCountInput);
                if (valueToPass <= 0) {
                  valueToPass = 1;
                }
                recalcuateJobFromSetup(
                  buildObject,
                  "jobCount",
                  valueToPass,
                  undefined,
                  activeJob,
                  updateActiveJob,
                  false
                );
                setJobModified(true);
              }}
            />
          </Grid>
          {activeJob.jobType === jobTypes.manufacturing && (
            <>
              <Grid item xs={6}>
                <FormControl
                  sx={{
                    "& .MuiFormHelperText-root": {
                      color: (theme) => theme.palette.secondary.main,
                    },
                    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                      {
                        display: "none",
                      },
                  }}
                  fullWidth
                >
                  <Select
                    variant="standard"
                    size="small"
                    value={activeJob.build.setup[setupToEdit].ME}
                    onChange={(e) => {
                      recalcuateJobFromSetup(
                        buildObject,
                        "ME",
                        e.target.value,
                        undefined,
                        activeJob,
                        updateActiveJob,
                        false
                      );
                      setJobModified(true);
                    }}
                  >
                    {blueprintOptions.me.map((entry) => {
                      return (
                        <MenuItem key={entry.label} value={entry.value}>
                          {entry.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText variant="standard">
                    Material Efficiency
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  sx={{
                    "& .MuiFormHelperText-root": {
                      color: (theme) => theme.palette.secondary.main,
                    },
                    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                      {
                        display: "none",
                      },
                  }}
                  fullWidth={true}
                >
                  <Select
                    variant="standard"
                    size="small"
                    value={activeJob.build.setup[setupToEdit].TE}
                    onChange={(e) => {
                      recalcuateJobFromSetup(
                        buildObject,
                        "TE",
                        e.target.value,
                        undefined,
                        activeJob,
                        updateActiveJob,
                        false
                      );
                      setJobModified(true);
                    }}
                  >
                    {blueprintOptions.te.map((entry) => {
                      return (
                        <MenuItem key={entry.label} value={entry.value}>
                          {entry.label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText variant="standard">
                    Time Efficiency
                  </FormHelperText>
                </FormControl>
              </Grid>
            </>
          )}
          <ManualStructureSelection
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            setJobModified={setJobModified}
            setupToEdit={setupToEdit}
            buildObject={buildObject}
          />
          {isLoggedIn && (
            <>
              <Grid item xs={12}>
                <FormControl
                  sx={{
                    "& .MuiFormHelperText-root": {
                      color: (theme) => theme.palette.secondary.main,
                    },
                    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                      {
                        display: "none",
                      },
                  }}
                  fullWidth={true}
                >
                  <Select
                    variant="standard"
                    size="small"
                    value={
                      activeJob.build.setup[setupToEdit].customStructureID
                        ? activeJob.build.setup[setupToEdit].customStructureID
                        : ""
                    }
                    onChange={(e) => {
                      recalcuateJobFromSetup(
                        buildObject,
                        "customStructureID",
                        e.target.value,
                        undefined,
                        activeJob,
                        updateActiveJob,
                        false
                      );
                      setJobModified(true);
                    }}
                  >
                    {activeJob.build.setup[setupToEdit].customStructureID ? (
                      <MenuItem key="clear" value={null}>
                        Clear
                      </MenuItem>
                    ) : null}
                    {parentUser.settings.structures[
                      customStructureMap[activeJob.jobType]
                    ].map((entry) => {
                      return (
                        <MenuItem key={entry.id} value={entry.id}>
                          {entry.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                  <FormHelperText variant="standard">
                    Custom Structure Used
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} xl={8}>
                <FormControl
                  sx={{
                    "& .MuiFormHelperText-root": {
                      color: (theme) => theme.palette.secondary.main,
                    },
                    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                      {
                        display: "none",
                      },
                  }}
                  fullWidth
                >
                  <Select
                    variant="standard"
                    size="small"
                    value={
                      users.find(
                        (i) =>
                          i.CharacterHash ===
                          activeJob.build.setup[setupToEdit].selectedCharacter
                      )?.CharacterHash || parentUser.CharacterHash
                    }
                    onChange={(e) => {
                      recalcuateJobFromSetup(
                        buildObject,
                        "selectedCharacter",
                        e.target.value,
                        undefined,
                        activeJob,
                        updateActiveJob,
                        false
                      );
                      setJobModified(true);
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
                  <FormHelperText variant="standard">
                    Assigned Character
                  </FormHelperText>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}

function ManualStructureSelection({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  buildObject,
}) {
  const [fetchSystemDataTrigger, updateFetchSystemDataTrigger] =
    useState(false);
  const { recalcuateJobFromSetup } = useUpdateSetupValue();
  const structureTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manStructure,
    [jobTypes.reaction]: structureOptions.reactionStructure,
  };
  const rigTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manRigs,
    [jobTypes.reaction]: structureOptions.reactionRigs,
  };
  const systemTypeMap = {
    [jobTypes.manufacturing]: structureOptions.manSystem,
    [jobTypes.reaction]: structureOptions.reactionSystem,
  };

  const systemIDMap = useMemo(() => {
    return buildSystemIDMap(systemIDS);
  }, []);

  if (activeJob.build.setup[setupToEdit].customStructureID) return null;

  return (
    <>
      <Grid item xs={6}>
        <Tooltip
          title={
            <span>
              <p>Medium: Astrahus, Athanor, Raitaru</p>
              <p>Large: Azbel, Fortizar, Tatara</p>
              <p>X-Large: Keepstar, Sotiyo </p>
            </span>
          }
          arrow
          placement="top"
        >
          <FormControl
            sx={{
              "& .MuiFormHelperText-root": {
                color: (theme) => theme.palette.secondary.main,
              },
              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                {
                  display: "none",
                },
            }}
            fullWidth={true}
          >
            <Select
              variant="standard"
              size="small"
              value={activeJob.build.setup[setupToEdit].structureID}
              onChange={(e) => {
                recalcuateJobFromSetup(
                  buildObject,
                  "structureID",
                  e.target.value,
                  structureTypeMap[activeJob.jobType][e.target.value]
                    .requirements,
                  activeJob,
                  updateActiveJob,
                  false
                );
                setJobModified(true);
              }}
            >
              {Object.values(structureTypeMap[activeJob.jobType]).map(
                (entry) => {
                  return (
                    <MenuItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </MenuItem>
                  );
                }
              )}
            </Select>
            <FormHelperText variant="standard">Structure Type</FormHelperText>
          </FormControl>
        </Tooltip>
      </Grid>
      <Grid item xs={6}>
        <FormControl
          sx={{
            "& .MuiFormHelperText-root": {
              color: (theme) => theme.palette.secondary.main,
            },
            "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
          }}
          fullWidth={true}
        >
          <Select
            variant="standard"
            size="small"
            value={activeJob.build.setup[setupToEdit].rigID}
            onChange={(e) => {
              recalcuateJobFromSetup(
                buildObject,
                "rigID",
                e.target.value,
                rigTypeMap[activeJob.jobType][e.target.value].requirements,
                activeJob,
                updateActiveJob,
                false
              );
              setJobModified(true);
            }}
          >
            {Object.values(rigTypeMap[activeJob.jobType]).map((entry) => {
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
        <FormControl
          sx={{
            "& .MuiFormHelperText-root": {
              color: (theme) => theme.palette.secondary.main,
            },
            "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
          }}
          fullWidth={true}
        >
          <Select
            variant="standard"
            size="small"
            value={activeJob.build.setup[setupToEdit].systemTypeID}
            onChange={(e) => {
              recalcuateJobFromSetup(
                buildObject,
                "systemTypeID",
                e.target.value,
                systemTypeMap[activeJob.jobType][e.target.value].requirements,
                activeJob,
                updateActiveJob,
                false
              );
              setJobModified(true);
            }}
          >
            {Object.values(systemTypeMap[activeJob.jobType]).map((entry) => {
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
      <Grid item xs={6} align="center">
        {!fetchSystemDataTrigger ? (
          <FormControl
            sx={{
              "& .MuiFormHelperText-root": {
                color: (theme) => theme.palette.secondary.main,
              },
              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                {
                  display: "none",
                },
            }}
            fullWidth
          >
            <Autocomplete
              disableClearable
              fullWidth
              id="System Search"
              clearOnBlur
              blurOnSelect
              value={
                systemIDMap[activeJob.build.setup[setupToEdit].systemID]
              }
              variant="standard"
              size="small"
              options={systemIDS}
              getOptionLabel={(option) => option.name}
              onChange={async (event, value) => {
                updateFetchSystemDataTrigger((prev) => !prev);
                await recalcuateJobFromSetup(
                  buildObject,
                  "systemID",
                  Number(value.id),
                  undefined,
                  activeJob,
                  updateActiveJob,
                  true
                );
                setJobModified(true);
                updateFetchSystemDataTrigger((prev) => !prev);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  margin="none"
                  variant="standard"
                  sx={{
                    borderRadius: "5px",
                  }}
                  InputProps={{
                    ...params.InputProps,
                    type: "System Name",
                  }}
                  value={
                    systemIDMap[activeJob.build.setup[setupToEdit].systemID]
                      .name
                  }
                />
              )}
            />
            <FormHelperText variant="standard">System Name</FormHelperText>
          </FormControl>
        ) : (
          <CircularProgress size={26} />
        )}
      </Grid>
      <Grid item xs={6}>
        <TextField
          defaultValue={activeJob.build.setup[setupToEdit].taxValue}
          size="small"
          variant="standard"
          helperText="Tax"
          type="number"
          sx={{
            "& .MuiFormHelperText-root": {
              color: (theme) => theme.palette.secondary.main,
            },
            "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
          }}
          onBlur={(e) => {
            let inputValue =
              Math.round((Number(e.target.value) + Number.EPSILON) * 100) / 100;
            if (inputValue < 0) {
              inputValue = 0;
            }
            recalcuateJobFromSetup(
              buildObject,
              "taxValue",
              inputValue,
              null,
              activeJob,
              updateActiveJob,
              false
            );
            setJobModified(true);
          }}
        />
      </Grid>
    </>
  );
}

function buildSystemIDMap(systemIDArray) {
  let results = {};

  for (let system of systemIDArray) {
    results[system.id] = system;
  }

  return results;
}
