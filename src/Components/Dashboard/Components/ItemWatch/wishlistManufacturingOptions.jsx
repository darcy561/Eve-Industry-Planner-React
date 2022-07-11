import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { makeStyles } from "@mui/styles";
import {
  blueprintOptions,
  structureOptions,
} from "../../../../Context/defaultValues";
import { useBlueprintCalc } from "../../../../Hooks/useBlueprintCalc";
import { jobTypes } from "../../../../Context/defaultValues";
import { useJobBuild } from "../../../../Hooks/useJobBuild";

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

export function WishListManufacturingOptions({
  importedJob,
  setImportedJob,
  materialJobs,
  setMaterialJobs,
}) {
  const [meValue, updateMEValue] = useState(importedJob.bpME);
  const [teValue, updateTEValue] = useState(importedJob.bpTE);
  const [structValue, updateStructValue] = useState(
    importedJob.structureTypeDisplay
  );
  const [rigsValue, updateRigsValue] = useState(importedJob.rigType);
  const [systemValue, updateSystemValue] = useState(importedJob.systemType);
  const { CalculateResources, CalculateTime } = useBlueprintCalc();
  const { recalculateItemQty } = useJobBuild();
  const classes = useStyles();

  return (
    <Grid container item xs={12} spacing={2}>
      <Grid container item xs={12}>
        <Grid item xs={6} sx={{ paddingRight: "10px" }}>
          <TextField
            defaultValue={importedJob.runCount}
            size="small"
            variant="standard"
            className={classes.TextField}
            helperText="Blueprint Runs"
            type="number"
            onBlur={(e) => {
              const oldJob = JSON.parse(JSON.stringify(importedJob));
              oldJob.runCount = Number(e.target.value);
              let newJob = CalculateResources(oldJob);
              newJob = CalculateTime(newJob);
              let newMaterialJobs = [...materialJobs];
              for (let mat of newJob.build.materials) {
                if (
                  mat.jobType === jobTypes.manufacturing ||
                  mat.jobType === jobTypes.reaction
                ) {
                  let index = newMaterialJobs.findIndex(
                    (i) => i.itemID === mat.typeID
                  );

                  if (index !== -1) {
                    newMaterialJobs[index] = recalculateItemQty(
                      newMaterialJobs[index],
                      mat.quantity
                    );
                    newMaterialJobs[index] = CalculateResources(
                      newMaterialJobs[index]
                    );
                    newMaterialJobs[index] = CalculateTime(
                      newMaterialJobs[index]
                    );
                  }
                }
              }
              setImportedJob(newJob);
              setMaterialJobs(newMaterialJobs);
            }}
          />
        </Grid>
        <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
          <TextField
            defaultValue={importedJob.jobCount}
            size="small"
            variant="standard"
            className={classes.TextField}
            helperText="Job Slots"
            type="number"
            onBlur={(e) => {
              const oldJob = JSON.parse(JSON.stringify(importedJob));
              oldJob.jobCount = Number(e.target.value);
              let newJob = CalculateResources(oldJob);
              let newMaterialJobs = [...materialJobs];
              for (let mat of newJob.build.materials) {
                if (
                  mat.jobType === jobTypes.manufacturing ||
                  mat.jobType === jobTypes.reaction
                ) {
                  let index = newMaterialJobs.findIndex(
                    (i) => i.itemID === mat.typeID
                  );
                  if (index !== -1) {
                    newMaterialJobs[index] = recalculateItemQty(
                      newMaterialJobs[index],
                      mat.quantity
                    );
                    newMaterialJobs[index] = CalculateResources(
                      newMaterialJobs[index]
                    );
                    newMaterialJobs[index] = CalculateTime(
                      newMaterialJobs[index]
                    );
                  }
                }
              }
              setImportedJob(newJob);
              setMaterialJobs(newMaterialJobs);
            }}
          />
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={6} sx={{ paddingRight: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={meValue}
              onChange={(e) => {
                const oldJob = JSON.parse(JSON.stringify(importedJob));
                oldJob.bpME = e.target.value;
                const newJob = CalculateResources(oldJob);
                let newMaterialJobs = [...materialJobs];
                for (let mat of newJob.build.materials) {
                  if (
                    mat.jobType === jobTypes.manufacturing ||
                    mat.jobType === jobTypes.reaction
                  ) {
                    let index = newMaterialJobs.findIndex(
                      (i) => i.itemID === mat.typeID
                    );
                    if (index !== -1) {
                      newMaterialJobs[index] = recalculateItemQty(
                        newMaterialJobs[index],
                        mat.quantity
                      );
                      newMaterialJobs[index] = CalculateResources(
                        newMaterialJobs[index]
                      );
                      newMaterialJobs[index] = CalculateTime(
                        newMaterialJobs[index]
                      );
                    }
                  }
                }
                updateMEValue(e.target.value);
                setImportedJob(newJob);
                setMaterialJobs(newMaterialJobs);
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
              Material Efficiecy
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={teValue}
              onChange={(e) => {
                const oldJob = JSON.parse(JSON.stringify(importedJob));
                oldJob.bpTE = e.target.value;
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                let newMaterialJobs = [...materialJobs];
                for (let mat of newJob.build.materials) {
                  if (
                    mat.jobType === jobTypes.manufacturing ||
                    mat.jobType === jobTypes.reaction
                  ) {
                    let index = newMaterialJobs.findIndex(
                      (i) => i.itemID === mat.typeID
                    );
                    if (index !== -1) {
                      newMaterialJobs[index] = recalculateItemQty(
                        newMaterialJobs[index],
                        mat.quantity
                      );
                      newMaterialJobs[index] = CalculateResources(
                        newMaterialJobs[index]
                      );
                      newMaterialJobs[index] = CalculateTime(
                        newMaterialJobs[index]
                      );
                    }
                  }
                }
                updateTEValue(e.target.value);
                setImportedJob(newJob);
                setMaterialJobs(newMaterialJobs);
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
            <FormHelperText variant="standard">Time Efficiecy</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={6} sx={{ paddingRight: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={structValue}
              onChange={(e) => {
                const oldJob = JSON.parse(JSON.stringify(importedJob));
                oldJob.structureTypeDisplay = e.target.value;
                oldJob.structureType = e.target.value === "Station" ? 0 : 1;
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                let newMaterialJobs = [...materialJobs];
                for (let mat of newJob.build.materials) {
                  if (
                    mat.jobType === jobTypes.manufacturing ||
                    mat.jobType === jobTypes.reaction
                  ) {
                    let index = newMaterialJobs.findIndex(
                      (i) => i.itemID === mat.typeID
                    );
                    if (index !== -1) {
                      newMaterialJobs[index] = recalculateItemQty(
                        newMaterialJobs[index],
                        mat.quantity
                      );
                      newMaterialJobs[index] = CalculateResources(
                        newMaterialJobs[index]
                      );
                      newMaterialJobs[index] = CalculateTime(
                        newMaterialJobs[index]
                      );
                    }
                  }
                }
                updateStructValue(e.target.value);
                setImportedJob(newJob);
                setMaterialJobs(newMaterialJobs);
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
        </Grid>
        <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={rigsValue}
              onChange={(e) => {
                const oldJob = JSON.parse(JSON.stringify(importedJob));
                oldJob.rigType = e.target.value;
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                let newMaterialJobs = [...materialJobs];
                for (let mat of newJob.build.materials) {
                  if (
                    mat.jobType === jobTypes.manufacturing ||
                    mat.jobType === jobTypes.reaction
                  ) {
                    let index = newMaterialJobs.findIndex(
                      (i) => i.itemID === mat.typeID
                    );
                    if (index !== -1) {
                      newMaterialJobs[index] = recalculateItemQty(
                        newMaterialJobs[index],
                        mat.quantity
                      );
                      newMaterialJobs[index] = CalculateResources(
                        newMaterialJobs[index]
                      );
                      newMaterialJobs[index] = CalculateTime(
                        newMaterialJobs[index]
                      );
                    }
                  }
                }
                setImportedJob(newJob);
                setMaterialJobs(newMaterialJobs);
                updateRigsValue(e.target.value);
              }}
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
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={6} sx={{ paddingRight: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={systemValue}
              onChange={(e) => {
                const oldJob = JSON.parse(JSON.stringify(importedJob));
                oldJob.systemType = e.target.value;
                let newJob = CalculateResources(oldJob);
                newJob = CalculateTime(newJob);
                let newMaterialJobs = [...materialJobs];
                for (let mat of newJob.build.materials) {
                  if (
                    mat.jobType === jobTypes.manufacturing ||
                    mat.jobType === jobTypes.reaction
                  ) {
                    let index = newMaterialJobs.findIndex(
                      (i) => i.itemID === mat.typeID
                    );
                    if (index !== -1) {
                      newMaterialJobs[index] = recalculateItemQty(
                        newMaterialJobs[index],
                        mat.quantity
                      );
                      newMaterialJobs[index] = CalculateResources(
                        newMaterialJobs[index]
                      );
                      newMaterialJobs[index] = CalculateTime(
                        newMaterialJobs[index]
                      );
                    }
                  }
                }
                setImportedJob(newJob);
                setMaterialJobs(newMaterialJobs);
                updateSystemValue(e.target.value);
              }}
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
    </Grid>
  );
}
