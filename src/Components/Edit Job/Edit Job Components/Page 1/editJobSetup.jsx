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
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../Context/AuthContext";

import {
  blueprintOptions,
  structureOptions,
} from "../../../../Context/defaultValues";
import { useBlueprintCalc } from "../../../../Hooks/useBlueprintCalc";
import { jobTypes } from "../../../../Context/defaultValues";
import systemIDS from "../../../../RawData/systems.json";
import { useSetupManagement } from "../../../../Hooks/GeneralHooks/useSetupManagement";
import { useMissingSystemIndex } from "../../../../Hooks/GeneralHooks/useImportMissingSystemIndexData";
import { SystemIndexContext } from "../../../../Context/EveDataContext";

export function EditJobSetup({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [recalculationTrigger, updateRecalculationTrigger] = useState(false);

  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const { recalculateSetup } = useSetupManagement();
  const { findMissingSystemIndex } = useMissingSystemIndex();
  const { updateSystemIndexData } = useContext(SystemIndexContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  let buildObject = useMemo(() => {
    return { ...activeJob.build.setup[setupToEdit] };
  }, [activeJob, recalculationTrigger]);

  const [runCountInput, updateRunCountInput] = useState(buildObject.runCount);
  const [jobCountInput, updateJobCountInput] = useState(buildObject.jobCount);

  const customStructureMap = {
    [jobTypes.manufacturing]: "manufacturing",
    [jobTypes.reaction]: "reaction",
  };

  useEffect(() => {
    console.log(recalculationTrigger);
    async function updateResourceCount() {
      if (recalculationTrigger) {
        const updatedSystemIndex = await findMissingSystemIndex(
          buildObject.systemID
        );
        const { jobSetups, newMaterialArray, newTotalProduced } =
          recalculateSetup(buildObject, activeJob);
        updateSystemIndexData(updatedSystemIndex);
        updateActiveJob((prev) => ({
          ...prev,
          build: {
            ...prev.build,
            setup: jobSetups,
            materials: newMaterialArray,
            products: {
              ...prev.build.products,
              totalQuantity: newTotalProduced,
            },
          },
        }));

        updateRecalculationTrigger(false);
      }
    }
    updateResourceCount();
  }, [recalculationTrigger]);

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
                if (runCountInput > 0) {
                  buildObject.runCount = Number(runCountInput);
                } else {
                  buildObject.runCount = 1;
                }
                updateRecalculationTrigger(true);
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
                if (jobCountInput > 0) {
                  buildObject.jobCount = Number(jobCountInput);
                } else {
                  buildObject.jobCount = 1;
                }
                updateRecalculationTrigger(true);
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
                  fullWidth={true}
                >
                  <Select
                    variant="standard"
                    size="small"
                    value={activeJob.build.setup[setupToEdit].ME}
                    onChange={(e) => {
                      buildObject.ME = e.target.value;
                      updateRecalculationTrigger(true);
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
                      buildObject.TE = e.target.value;
                      updateRecalculationTrigger(true);
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
            updateRecalculationTrigger={updateRecalculationTrigger}
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
                      if (!e.target.value) {
                        buildObject.customStructureID = null;
                      } else {
                        const selectedStructure =
                          parentUser.settings.structures[
                            customStructureMap[activeJob.jobType]
                          ].find((i) => i.id === e.target.value);
                        buildObject.customStructureID = selectedStructure.id;
                        buildObject.structureID =
                          selectedStructure.structureType;
                        buildObject.rigID = selectedStructure.rigType;
                        buildObject.systemTypeID = selectedStructure.systemType;
                        buildObject.systemID = selectedStructure.systemID;
                        buildObject.taxValue = selectedStructure.tax;
                      }
                      updateRecalculationTrigger(true);
                      setJobModified(true);
                    }}
                  >
                    <MenuItem key="clear" value={null}>
                      Clear
                    </MenuItem>
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
                  fullWidth={true}
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
                      buildObject.selectedCharacter = e.target.value;
                      updateRecalculationTrigger(true);
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
  updateRecalculationTrigger,
  buildObject,
}) {
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
                if (
                  activeJob.jobType === jobTypes.manufacturing &&
                  e.target.value === structureTypeMap[activeJob.jobType][0].id
                ) {
                  buildObject.taxValue =
                    structureTypeMap[activeJob.jobType][0].defaultTax;
                }

                buildObject.structureID = e.target.value;
                updateRecalculationTrigger(true);
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
              buildObject.rigID = e.target.value;
              updateRecalculationTrigger(true);
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
              buildObject.systemTypeID = e.target.value;
              updateRecalculationTrigger(true);
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
          <Autocomplete
            disableClearable
            fullWidth
            id="System Search"
            clearOnBlur
            blurOnSelect
            variant="standard"
            size="small"
            options={systemIDS}
            getOptionLabel={(option) => option.name}
            onChange={async (event, value) => {
              buildObject.systemID = Number(value.id);
              updateRecalculationTrigger(true);
              setJobModified(true);
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
              />
            )}
          />
          <FormHelperText variant="standard">System Name</FormHelperText>
        </FormControl>
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
            if (
              activeJob.jobType === jobTypes.manufacturing &&
              activeJob.build.setup[setupToEdit].structureID ===
                structureTypeMap[activeJob.jobType][0].id
            ) {
              buildObject.taxValue =
                structureTypeMap[activeJob.jobType][0].defaultTax;
            } else {
              buildObject.taxValue = inputValue;
            }
            updateRecalculationTrigger(true);
            setJobModified(true);
          }}
        />
      </Grid>
    </>
  );
}
