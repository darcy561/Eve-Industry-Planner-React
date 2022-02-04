import { Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import ClearIcon from '@mui/icons-material/Clear';
import { MdAdd } from "react-icons/md";

export function ExtrasList({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [extras, updateExtras] = useState({ text: "", value: 0 });
  const { setSnackbarData } = useContext(SnackBarDataContext);

  function handleAdd() {
    const newExtrasArray = activeJob.build.costs.extrasCosts;
    let newTotal = 0;
    newExtrasArray.push({
      id: Date.now(),
      extraText: extras.text,
      extraValue: extras.value,
    });
    newExtrasArray.forEach((extra) => {
      newTotal += extra.extraValue;
    });
    updateActiveJob((prevObj) => ({
      ...prevObj,
      build: {
        ...prevObj.build,
        costs: {
          ...prevObj.build.costs,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `Added`,
      severity: "success",
      autoHideDuration: 1000,
    }));
    setJobModified(true);
  }

  function handleRemove(extraID) {
    const extraIndex = activeJob.build.costs.extrasCosts.findIndex(
      (x) => x.id === extraID
    );
    const newExtrasArray = activeJob.build.costs.extrasCosts;
    let newTotal = 0;
    if (extraIndex !== -1) {
      newExtrasArray.splice(extraIndex, 1);
    }
    newExtrasArray.forEach((extra) => {
      newTotal += extra.extraValue;
    });
    updateActiveJob((prevObj) => ({
      ...prevObj,
      build: {
        ...prevObj.build,
        costs: {
          ...prevObj.build.costs,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `Deleted`,
      severity: "error",
      autoHideDuration: 1000,
    }));
    setJobModified(true);
  }

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid item xs={12} sx={{marginBottom: "10px"}}>
          <Typography variant="h6" color="primary">
            Extra Costs:
          </Typography>
              </Grid>
              <Grid container item direction="row" spacing={3} sx={{
                  minHeight: "10vh"
            }}>
        {activeJob.build.costs.extrasCosts.map((item) => {
            return (
              <Grid key={item.id} container item>
              <Grid item xs={5}>
                <Typography variant="body2">{item.extraText}</Typography>
              </Grid>
              <Grid item xs={5}>
                <Typography variant="body2">
                  {item.extraValue.toLocaleString()} ISK
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleRemove(item.id)}
                >
                  <ClearIcon />
                </IconButton>
              </Grid>
            </Grid>
          );
        })}
        </Grid>
        <Grid container direction="row" item xs={12} spacing={3}>
          <Grid item xs={5}>
            <TextField
              defaultValue={extras.text}
              variant="standard"
              size="small"
              helperText="Reminder Text"
              type="text"
              onBlur={(e) => {
                let input = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "")
                updateExtras((prevState) => ({
                  ...prevState,
                  text: input,
                }));
              }}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              defaultValue={extras.value}
              variant="standard"
              size="small"
              helperText="Cost"
              type="number"
              onBlur={(e) => {
                updateExtras((prevState) => ({
                  ...prevState,
                  value: Number(e.target.value),
                }));
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton
              color="primary"
              onClick={() => handleAdd()}
              size="large"
            >
              <MdAdd />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
