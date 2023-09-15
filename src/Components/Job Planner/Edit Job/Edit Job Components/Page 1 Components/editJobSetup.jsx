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
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";

import {
  blueprintOptions,
  structureOptions,
} from "../../../../../Context/defaultValues";
import { useBlueprintCalc } from "../../../../../Hooks/useBlueprintCalc";
import { jobTypes } from "../../../../../Context/defaultValues";
import systemIDS from "../../../../../RawData/systems.json";
import { useSetupManagement } from "../../../../../Hooks/GeneralHooks/useSetupManagement";

export function EditJobSetup({
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [recalculationTrigger, updateRecalculationTrigger] = useState(false);
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const { recalculateSetup } = useSetupManagement();
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  let buildObject = useMemo(() => {
    return { ...activeJob.build.setup[setupToEdit] };
  }, [activeJob]);

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
              defaultValue={activeJob.build.setup[setupToEdit].runCount}
              size="small"
              variant="standard"
              helperText="Blueprint Runs"
              type="number"
              onBlur={(e) => {
                buildObject.runCount = Number(e.target.value);
                updateRecalculationTrigger(true);
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              defaultValue={activeJob.build.setup[setupToEdit].jobCount}
              size="small"
              variant="standard"
              helperText="Job Slots"
              type="number"
              onBlur={(e) => {
                buildObject.jobCount = Number(e.target.value);
                updateRecalculationTrigger(true);
                setJobModified(true);
              }}
            />
          </Grid>
          {activeJob.jobType === jobTypes.manufacturing && (
            <>
              <Grid item xs={6}>
                <FormControl fullWidth={true}>
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
                <FormControl fullWidth={true}>
                  <Select
                    variant="standard"
                    size="small"
                    value={activeJob.build.setup[setupToEdit].TE}
                    onChange={(e) => {
                      console.log(e.target.value);
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
            setJobModified={setJobModified}
            setupToEdit={setupToEdit}
            updateRecalculationTrigger={updateRecalculationTrigger}
            buildObject={buildObject}
          />
          {isLoggedIn && (
            <>
              <Grid item xs={12}>
                <FormControl fullWidth={true}>
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
                <FormControl fullWidth={true}>
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
  setJobModified,
  setupToEdit,
  updateRecalculationTrigger,
  buildObject,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const classes = useStyles();

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
          <FormControl fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={activeJob.build.setup[setupToEdit].structureID}
              onChange={(e) => {
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
        <FormControl fullWidth={true}>
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
        <FormControl fullWidth={true}>
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
        <FormControl fullWidth>
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
            onChange={(event, value) => {
              buildObject.systemID = Number.value.id;
              updateRecalculationTrigger(true);
              setJobModified(true);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                margin="none"
                variant="standard"
                style={{ borderRadius: "5px" }}
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
          className={classes.TextField}
          helperText="Tax"
          type="number"
          onBlur={(e) => {
            let inputValue =
              Math.round((Number(e.target.value) + Number.EPSILON) * 100) / 100;
            if (inputValue < 0) {
              inputValue = 0;
            }
            buildObject.taxValue = inputValue;
            updateRecalculationTrigger(true);
            setJobModified(true);
          }}
        />
      </Grid>
    </>
  );
}
