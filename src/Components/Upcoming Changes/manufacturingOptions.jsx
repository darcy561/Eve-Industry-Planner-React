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
  itemLoad,
}) {
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const [runValue, updateRunValue] = useState(1);
  const [jobValue, updateJobValue] = useState(1);
  const [meValue, updateMEValue] = useState(0);
  const [teValue, updateTEValue] = useState(0);
  const [structType, updateStructType] = useState(0);
  const [rigsValue, updateRigsValue] = useState(0);
  const [systemValue, updateSystemValue] = useState(1);

  const classes = useStyles();

  useEffect(() => {
    function updateDefaultValues() {
      if (tranqItem !== null && sisiItem !== null) {
        if (tranqItem === null && sisiItem !== null) {
          updateRunValue(sisiItem.runCount);
          updateJobValue(sisiItem.jobCount);
          updateMEValue(sisiItem.bpME);
          updateTEValue(sisiItem.bpTE);
          updateStructType(sisiItem.structureType);
          updateRigsValue(sisiItem.rigType);
          updateSystemValue(sisiItem.systemType);
        } else {
          updateRunValue(tranqItem.runCount);
          updateJobValue(tranqItem.jobCount);
          updateMEValue(tranqItem.bpME);
          updateTEValue(tranqItem.bpTE);
          updateStructType(tranqItem.structureType);
          updateRigsValue(tranqItem.rigType);
          updateSystemValue(tranqItem.systemType);
        }
      }
    }
    updateDefaultValues();
  }, [itemLoad]);

  useEffect(() => {
    updateTranqItem((prev) => ({
      ...prev,
      runCount: runValue,
      jobCount: jobValue,
      bpME: meValue,
      bpTE: teValue,
      structureType: structType,
      rigType: rigsValue,
      systemType: systemValue,
      build: {
        ...prev.build,
        materials: CalculateResources({
          jobType: prev.jobType,
          rawMaterials: prev.rawData.materials,
          outputMaterials: prev.build.materials,
          runCount: runValue,
          jobCount: jobValue,
          bpME: meValue,
          structureType: structType,
          rigType: rigsValue,
          systemType: systemValue,
        }),
        products: {
          ...prev.build.products,
          totalQuantity:
            prev.rawData.products[0].quantity * runValue * jobValue,
          quantityPerJob: prev.rawData.products[0].quantity * jobValue,
        },
        time: CalculateTime({
          jobType: prev.jobType,
          CharacterHash: prev.build.buildChar,
          structureType: structType,
          rigType: rigsValue,
          runCount: runValue,
          bpTE: teValue,
          rawTime: prev.rawData.time,
          skills: prev.skills,
        }),
      },
    }));
    updateSisiItem((prev) => ({
      ...prev,
      runCount: runValue,
      jobCount: jobValue,
      bpME: meValue,
      bpTE: teValue,
      structureType: structType,
      rigType: rigsValue,
      systemType: systemValue,
      build: {
        ...prev.build,
        materials: CalculateResources({
          jobType: prev.jobType,
          rawMaterials: prev.rawData.materials,
          outputMaterials: prev.build.materials,
          runCount: runValue,
          jobCount: jobValue,
          bpME: meValue,
          structureType: structType,
          rigType: rigsValue,
          systemType: systemValue,
        }),
        products: {
          ...prev.build.products,
          totalQuantity:
            prev.rawData.products[0].quantity * runValue * jobValue,
          quantityPerJob: prev.rawData.products[0].quantity * jobValue,
        },
        time: CalculateTime({
          jobType: prev.jobType,
          CharacterHash: prev.build.buildChar,
          structureType: structType,
          rigType: rigsValue,
          runCount: runValue,
          bpTE: teValue,
          rawTime: prev.rawData.time,
          skills: prev.skills,
        }),
      },
    }));
  }, [
    runValue,
    jobValue,
    meValue,
    teValue,
    structType,
    rigsValue,
    systemValue,
  ]);

  return (
    <Paper
      square
      elevation={3}
      sx={{
        padding: "20px",
      }}
    >
      <Grid container>
        <Grid item xs={6} sm={3} md={3} align="center">
          <TextField
            fullWidth
            className={classes.TextField}
            defaultValue={runValue}
            size="small"
            variant="standard"
            helperText="Blueprint Runs"
            type="number"
            onBlur={(e) => {
              updateRunValue(Number(e.target.value));
            }}
            sx={{
              paddingLeft: "5px",
              paddingRight: "5px",
            }}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={3} align="center">
          <TextField
            fullWidth
            defaultValue={jobValue}
            className={classes.TextField}
            size="small"
            variant="standard"
            helperText="Job Slots"
            type="number"
            onBlur={(e) => {
              updateJobValue(Number(e.target.value));
            }}
            sx={{ paddingLeft: "5px", paddingRight: "5px" }}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={3} align="center">
          <FormControl
            className={classes.TextField}
            fullWidth
            sx={{ paddingLeft: "5px", paddingRight: "5px" }}
          >
            <Select
              fullWidth
              defaultValue={meValue}
              variant="standard"
              size="small"
              value={meValue}
              onChange={(e) => {
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
        <Grid item xs={6} sm={3} md={3} align="center">
          <FormControl
            className={classes.TextField}
            fullWidth
            sx={{ paddingLeft: "5px", paddingRight: "5px" }}
          >
            <Select
              defaultValue={teValue}
              variant="standard"
              size="small"
              value={teValue}
              onChange={(e) => {
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
        <Grid item xs={6} sm={3} md={4} align="center">
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
              className={classes.TextField}
              fullWidth
              sx={{ paddingLeft: "5px", paddingRight: "5px" }}
            >
              <Select
                variant="standard"
                size="small"
                value={structType}
                onChange={(e) => {
                  updateStructType(e.target.value);
                }}
              >
                {Object.values(structureOptions.manStructure).map((entry) => {
                  return (
                    <MenuItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">Structure Type</FormHelperText>
            </FormControl>
          </Tooltip>
        </Grid>
        <Grid item xs={6} sm={3} md={4} align="center">
          <FormControl
            className={classes.TextField}
            fullWidth
            sx={{ paddingLeft: "5px", paddingRight: "5px" }}
          >
            <Select
              variant="standard"
              size="small"
              value={rigsValue}
              onChange={(e) => {
                updateRigsValue(e.target.value);
              }}
            >
              {Object.values(structureOptions.manRigs).map((entry) => {
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
        <Grid item xs={6} sm={3} md={4} align="center">
          <FormControl
            className={classes.TextField}
            fullWidth
            sx={{ paddingLeft: "5px", paddingRight: "5px" }}
          >
            <Select
              variant="standard"
              size="small"
              value={systemValue}
              onChange={(e) => {
                updateSystemValue(e.target.value);
              }}
            >
              {Object.values(structureOptions.manSystem).map((entry) => {
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
      </Grid>
    </Paper>
  );
}
