import { useEffect, useState } from "react";
import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  blueprintOptions,
  structureOptions,
} from "../../Context/defaultValues";

import { makeStyles } from "@mui/styles";
import { useBlueprintCalc } from "../../Hooks/useBlueprintCalc";

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

export function ManufacturingOptionsUpcomingChanges({
  tranqItem,
  updateTranqItem,
  sisiItem,
  updateSisiItem,
  pageLoad,
}) {
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const [runValue, updateRunValue] = useState(1);
  const [jobValue, updateJobValue] = useState(1);
  const [meValue, updateMEValue] = useState(0);
  const [teValue, updateTEValue] = useState(0);
  const [structValue, updateStructValue] = useState(0);
  const [rigsValue, updateRigsValue] = useState(0);
  const [systemValue, updateSystemValue] = useState(0);

  const classes = useStyles();

  useEffect(() => {
    function updateDefaultValues() {
      if (tranqItem === null && sisiItem !== null) {
        updateRunValue(sisiItem.runCount);
        updateJobValue(sisiItem.jobCount);
        updateMEValue(sisiItem.bpME);
        updateTEValue(sisiItem.bpTE);
        updateStructValue(sisiItem.structureTypeDisplay);
        updateRigsValue(sisiItem.rigType);
        updateSystemValue(sisiItem.systemType);
      } else {
        updateRunValue(sisiItem.runCount);
        updateJobValue(sisiItem.jobCount);
        updateMEValue(tranqItem.bpME);
        updateTEValue(tranqItem.bpTE);
        updateStructValue(tranqItem.structureTypeDisplay);
        updateRigsValue(tranqItem.rigType);
        updateSystemValue(tranqItem.systemType);
      }
    }
    updateDefaultValues();
  }, [pageLoad]);

  return (
    <Paper>
      <Grid container>
        <Grid item xs={3}>
          <TextField
            className={classes.TextField}
            defaultValue={runValue}
            size="small"
            variant="standard"
            helperText="Blueprint Runs"
            type="number"
            onBlur={(e) => {
              let oldTranqItem = JSON.parse(JSON.stringify(tranqItem));
              let oldSisiItem = JSON.parse(JSON.stringify(sisiItem));
              oldTranqItem.runCount = Number(e.target.value);
              oldSisiItem.runCount = Number(e.target.value);
              let newTranqItem = CalculateResources(oldTranqItem);
              newTranqItem = CalculateTime(newTranqItem);
              let newSisiItem = CalculateResources(oldSisiItem);
              newSisiItem = CalculateTime(newSisiItem);
              updateTranqItem(newTranqItem);
              updateSisiItem(newSisiItem);
              updateRunValue(Number(e.target.value));
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <TextField
            defaultValue={jobValue}
            className={classes.TextField}
            size="small"
            variant="standard"
            helperText="Job Slots"
            type="number"
            onBlur={(e) => {
              let oldTranqItem = JSON.parse(JSON.stringify(tranqItem));
              let oldSisiItem = JSON.parse(JSON.stringify(sisiItem));
              oldTranqItem.jobCount = Number(e.target.value);
              oldSisiItem.jobCount = Number(e.target.value);
              let newTranqItem = CalculateResources(oldTranqItem);
              newTranqItem = CalculateTime(newTranqItem);
              let newSisiItem = CalculateResources(oldSisiItem);
              newSisiItem = CalculateTime(newSisiItem);
              updateTranqItem(newTranqItem);
              updateSisiItem(newSisiItem);
              updateJobValue(Number(e.target.value));
            }}
          />
        </Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Select
              defaultValue={meValue}
              variant="standard"
              size="small"
              value={meValue}
              onChange={(e) => {
                let oldTranqItem = JSON.parse(JSON.stringify(tranqItem));
                let oldSisiItem = JSON.parse(JSON.stringify(sisiItem));
                oldTranqItem.bpME = Number(e.target.value);
                oldSisiItem.bpME = Number(e.target.value);
                let newTranqItem = CalculateResources(oldTranqItem);
                newTranqItem = CalculateTime(newTranqItem);
                let newSisiItem = CalculateResources(oldSisiItem);
                newSisiItem = CalculateTime(newSisiItem);
                updateTranqItem(newTranqItem);
                updateSisiItem(newSisiItem);
                updateMEValue(e.target.value);
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
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Select
              defaultValue={teValue}
              variant="standard"
              size="small"
              value={teValue}
              onChange={(e) => {
                let oldTranqItem = JSON.parse(JSON.stringify(tranqItem));
                let oldSisiItem = JSON.parse(JSON.stringify(sisiItem));
                oldTranqItem.bpTE = Number(e.target.value);
                oldSisiItem.bpTE = Number(e.target.value);
                let newTranqItem = CalculateResources(oldTranqItem);
                newTranqItem = CalculateTime(newTranqItem);
                let newSisiItem = CalculateResources(oldSisiItem);
                newSisiItem = CalculateTime(newSisiItem);
                updateTranqItem(newTranqItem);
                updateSisiItem(newSisiItem);
                updateTEValue(e.target.value);
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
            <FormHelperText variant="standard">Time Efficiency</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={4}>
          <Tooltip
            title={
              <span>
                <p>Medium: Astrahus, Raitaru, Athanor</p>
                <p>Large: Fortizar, Azbel, Tatara</p>
                <p>X-Large: Sotiyo, Keepstar</p>
              </span>
            }
            arrow
            placement="top"
          >
            <FormControl className={classes.TextField} fullWidth={true}>
              <Select
                variant="standard"
                size="small"
                value={structValue}
                onChange={(e) => {
                  let oldTranqItem = JSON.parse(JSON.stringify(tranqItem));
                  let oldSisiItem = JSON.parse(JSON.stringify(sisiItem));
                  oldTranqItem.structureTypeDisplay = e.target.value;
                  oldTranqItem.structureType =
                    e.target.value === "Station" ? 0 : 1;
                  oldSisiItem.structureTypeDisplay = e.target.value;
                  oldSisiItem.structureType =
                    e.target.value === "Station" ? 0 : 1;
                  let newTranqItem = CalculateResources(oldTranqItem);
                  newTranqItem = CalculateTime(newTranqItem);
                  let newSisiItem = CalculateResources(oldSisiItem);
                  newSisiItem = CalculateTime(newSisiItem);
                  updateTranqItem(newTranqItem);
                  updateSisiItem(newSisiItem);
                  updateStructValue(e.target.value);
                }}
              >
                {structureOptions.manStructure.map((entry) => {
                  return (
                    <MenuItem key={entry.label} value={entry.value}>
                      {entry.label}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">Structure Type</FormHelperText>
            </FormControl>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={rigsValue}
              onChange={(e) => {}}
            >
              {structureOptions.manRigs.map((entry) => {
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
        <Grid item xs={4}>
          <FormControl className={classes.TextField} fullWidth>
            <Select
              variant="standard"
              size="small"
              value={systemValue}
              onChange={(e) => {}}
            >
              {structureOptions.manSystem.map((entry) => {
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
      </Grid>
    </Paper>
  );
}
