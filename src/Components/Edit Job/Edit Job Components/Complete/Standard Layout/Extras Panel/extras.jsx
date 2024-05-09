import { useState } from "react";
import { Grid, IconButton, Paper, TextField, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { MdAdd } from "react-icons/md";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function ExtrasPanel({ activeJob, updateActiveJob, setJobModified }) {
  const { sendSnackbarNotificationSuccess, sendSnackbarNotificationError } =
    useHelperFunction();
  const [extras, updateExtras] = useState({ text: "", value: 0 });

  function handleAdd(event) {
    event.preventDefault();
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
    sendSnackbarNotificationSuccess("Success");
    setJobModified(true);
  }

  function handleRemove(index) {
    let newExtrasArray = activeJob.build.costs.extrasCosts;
    let newTotal = 0;
    newExtrasArray.splice(index, 1);
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
    sendSnackbarNotificationError("Deleted");
    setJobModified(true);
  }

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square
    >
      <Grid container>
        <Grid item xs={12} sx={{ marginBottom: "10px" }}>
          <Typography variant="h6" color="primary">
            Extra Costs:
          </Typography>
        </Grid>
        <Grid
          container
          item
          spacing={3}
          sx={{
            minHeight: "10vh",
          }}
        >
          {activeJob.build.costs.extrasCosts.map((item, index) => {
            return (
              <Grid key={item.id} container item>
                <Grid item xs={5}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    {item.extraText}
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    {item.extraValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => handleRemove(index)}
                  >
                    <ClearIcon />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
        <form onSubmit={handleAdd}>
          <Grid container item xs={12} spacing={3}>
            <Grid item xs={5}>
              <TextField
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                }}
                defaultValue={extras.text}
                variant="standard"
                required={true}
                size="small"
                helperText="Reminder Text"
                type="text"
                onBlur={(e) => {
                  let input = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "");
                  updateExtras((prevState) => ({
                    ...prevState,
                    text: input,
                  }));
                }}
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                }}
                defaultValue={extras.value}
                variant="standard"
                required={true}
                size="small"
                helperText="Cost"
                type="number"
                onBlur={(e) => {
                  updateExtras((prevState) => ({
                    ...prevState,
                    value: Number(e.target.value),
                  }));
                }}
                inputProps={{
                  step: "0.01",
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton color="primary" type="submit" size="large">
                <MdAdd />
              </IconButton>
            </Grid>
          </Grid>
        </form>
      </Grid>
    </Paper>
  );
}
