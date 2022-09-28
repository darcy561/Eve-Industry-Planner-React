import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { makeStyles } from "@mui/styles";
import {
  blueprintOptions,
  structureOptions,
} from "../../../../Context/defaultValues";
import { useBlueprintCalc } from "../../../../Hooks/useBlueprintCalc";
import { jobTypes } from "../../../../Context/defaultValues";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { UsersContext } from "../../../../Context/AuthContext";

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
  const { users } = useContext(UsersContext);
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
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  });

  useEffect(() => {
    let newMaterialJobs = [...materialJobs];
    for (let mat of importedJob.build.materials) {
      let index = newMaterialJobs.findIndex((i) => i.itemID === mat.typeID);
      if (index !== -1) {
        newMaterialJobs[index] = recalculateItemQty(
          newMaterialJobs[index],
          mat.quantity
        );
        newMaterialJobs[index].build.materials = CalculateResources({
          jobType: newMaterialJobs[index].jobType,
          rawMaterials: newMaterialJobs[index].rawData.materials,
          outputMaterials: newMaterialJobs[index].build.materials,
          runCount: newMaterialJobs[index].runCount,
          jobCount: newMaterialJobs[index].jobCount,
          bpME: newMaterialJobs[index].bpME,
          structureType: newMaterialJobs[index].structureType,
          rigType: newMaterialJobs[index].rigType,
          systemType: newMaterialJobs[index].systemType,
        });
        newMaterialJobs[index].build.time = CalculateTime({
          jobType: newMaterialJobs[index].jobType,
          CharacterHash: newMaterialJobs[index].build.buildChar,
          structureTypeDisplay: newMaterialJobs[index].structureTypeDisplay,
          runCount: newMaterialJobs[index].runCount,
          bpTE: newMaterialJobs[index].bpTE,
          rawTime: newMaterialJobs[index].rawData.time,
          skills: newMaterialJobs[index].skills,
        });
        newMaterialJobs[index].build.products.totalQuantity =
          newMaterialJobs[index].rawData.products[0].quantity *
          newMaterialJobs[index].runCount *
          newMaterialJobs[index].jobCount;

        newMaterialJobs[index].build.products.quantityPerJob =
          newMaterialJobs[index].rawData.products[0].quantity *
          newMaterialJobs[index].runCount;
      }
    }
    setMaterialJobs(newMaterialJobs);
  }, [importedJob]);

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
              setImportedJob((prev) => ({
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
                    structureTypeDisplay: prev.structureTypeDisplay,
                    runCount: Number(e.target.value),
                    bpTE: prev.bpTE,
                    rawTime: prev.rawData.time,
                    skills: prev.skills,
                  }),
                },
              }));
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
              setImportedJob((prev) => ({
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
                updateMEValue(e.target.value);
                setImportedJob((prev) => ({
                  ...prev,
                  bpME: e.target.value,
                  build: {
                    ...prev.build,
                    materials: CalculateResources({
                      jobType: prev.jobType,
                      rawMaterials: prev.rawData.materials,
                      outputMaterials: prev.build.materials,
                      runCount: prev.runCount,
                      jobCount: prev.jobCount,
                      bpME: e.target.value,
                      structureType: prev.structureType,
                      rigType: prev.rigType,
                      systemType: prev.systemType,
                    }),
                  },
                }));
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
        <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={teValue}
              onChange={(e) => {
                updateTEValue(e.target.value);
                setImportedJob((prev) => ({
                  ...prev,
                  bpTE: e.target.value,
                  build: {
                    ...prev.build,
                    time: CalculateTime({
                      jobType: prev.jobType,
                      CharacterHash: prev.build.buildChar,
                      structureTypeDisplay: prev.structureTypeDisplay,
                      runCount: prev.runCount,
                      bpTE: e.target.value,
                      rawTime: prev.rawData.time,
                      skills: prev.skills,
                    }),
                  },
                }));
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
      </Grid>
      <Grid container item xs={12}>
        <Grid item xs={6} sx={{ paddingRight: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              value={structValue}
              onChange={(e) => {
                updateStructValue(e.target.value);
                setImportedJob((prev) => ({
                  ...prev,
                  structureTypeDisplay: e.target.value,
                  structureType: e.target.value === "Station" ? 0 : 1,
                  build: {
                    ...prev.build,
                    materials: CalculateResources({
                      jobType: prev.jobType,
                      rawMaterials: prev.rawData.materials,
                      outputMaterials: prev.build.materials,
                      runCount: prev.runCount,
                      jobCount: prev.jobCount,
                      bpME: prev.bpME,
                      structureType: e.target.value === "Station" ? 0 : 1,
                      rigType: prev.rigType,
                      systemType: prev.systemType,
                    }),
                    time: CalculateTime({
                      jobType: prev.jobType,
                      CharacterHash: prev.build.buildChar,
                      structureTypeDisplay: e.target.value,
                      runCount: prev.runCount,
                      bpTE: prev.bpTE,
                      rawTime: prev.rawData.time,
                      skills: prev.skills,
                    }),
                  },
                }));
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
                updateRigsValue(e.target.value);
                setImportedJob((prev) => ({
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
                      structureTypeDisplay: prev.structureTypeDisplay,
                      runCount: prev.runCount,
                      bpTE: prev.bpTE,
                      rawTime: prev.rawData.time,
                      skills: prev.skills,
                    }),
                  },
                }));
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
                updateSystemValue(e.target.value);
                setImportedJob((prev) => ({
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
        <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
          <FormControl className={classes.TextField} fullWidth={true}>
            <Select
              variant="standard"
              size="small"
              renderValue={(selected) =>
                selected.map((item) => item.name).join(", ")
              }
              value=""
              onChange={(e) => {
                const structure =
                  parentUser.settings.structures.manufacturing.find(
                    (i) => i.id === e.target.value
                  );
                updateStructValue(structure.structureName);
                updateRigsValue(structure.rigType);
                updateSystemValue(structure.systemType);
                setImportedJob((prev) => ({
                  ...prev,
                  rigType: structure.rigType,
                  systemType: structure.systemType,
                  structureTypeDisplay: structure.structureName,
                  structureType: structure.structureValue,
                  build: {
                    ...prev.build,
                    materials: CalculateResources({
                      jobType: prev.jobType,
                      rawMaterials: prev.rawData.materials,
                      outputMaterials: prev.build.materials,
                      runCount: prev.runCount,
                      jobCount: prev.jobCount,
                      bpME: prev.bpME,
                      structureType: structure.structureValue,
                      rigType: structure.rigType,
                      systemType: structure.systemType,
                    }),
                    time: CalculateTime({
                      jobType: prev.jobType,
                      CharacterHash: prev.build.buildChar,
                      structureTypeDisplay: structure.structureName,
                      runCount: prev.runCount,
                      bpTE: prev.bpTE,
                      rawTime: prev.rawData.time,
                      skills: prev.skills,
                    }),
                  },
                }));
              }}
            >
              {parentUser.settings.structures.manufacturing.map((entry) => {
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
      </Grid>
    </Grid>
  );
}
