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
  const [structValue, updateStructValue] = useState(
    activeJob.structureTypeDisplay
  );
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
                  let oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.build.buildChar = e.target.value;
                  let newJob = CalculateTime(oldJob);
                  updateBuildCharName(e.target.value);
                  updateActiveJob(newJob);
                }}
              >
                {users.map((user) => {
                  return (
                    <MenuItem
                      key={user.CharacterName}
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
                const oldJob = JSON.parse(JSON.stringify(activeJob));
                oldJob.runCount = Number(e.target.value);
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                updateActiveJob(newJob);
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
                const oldJob = JSON.parse(JSON.stringify(activeJob));
                oldJob.jobCount = Number(e.target.value);
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                updateActiveJob(newJob);
                setJobModified(true);
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <Tooltip
              title={
                <span>
                  <p>Medium: Astrahus, Raitaru, Athanor</p>
                  <p>Large: Fortizar, Azbel, Tatara</p>
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
                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.structureTypeDisplay = e.target.value;
                    oldJob.structureType = 1;
                    let newJob = CalculateResources(oldJob);
                    newJob = CalculateTime(newJob);
                    updateStructValue(e.target.value);
                    updateActiveJob(newJob);
                  }}
                >
                  {structureOptions.reactionStructure.map((entry) => {
                    return (
                      <MenuItem key={entry.label} value={entry.value}>
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
                  const oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.rigType = e.target.value;
                  let newJob = CalculateResources(oldJob);
                  newJob = CalculateTime(newJob);
                  updateActiveJob(newJob);
                  updateRigsValue(e.target.value);
                  setJobModified(true);
                }}
              >
                {structureOptions.reactionRigs.map((entry) => {
                  return (
                    <MenuItem key={entry.label} value={entry.value}>
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
                  const oldJob = JSON.parse(JSON.stringify(activeJob));
                  oldJob.systemType = e.target.value;
                  let newJob = CalculateResources(oldJob);
                  newJob = CalculateTime(newJob);
                  updateActiveJob(newJob);
                  updateSystemValue(e.target.value);
                  setJobModified(true);
                }}
              >
                {structureOptions.reactionSystem.map((entry) => {
                  return (
                    <MenuItem key={entry.label} value={entry.value}>
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

                    const oldJob = JSON.parse(JSON.stringify(activeJob));
                    oldJob.rigType = structure.rigType;
                    oldJob.systemType = structure.systemType;
                    oldJob.structureType = structure.structureValue;
                    oldJob.structureTypeDisplay = structure.structureName;
                    let newJob = CalculateResources(oldJob);
                    newJob = CalculateTime(newJob);
                    updateActiveJob(newJob);
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
