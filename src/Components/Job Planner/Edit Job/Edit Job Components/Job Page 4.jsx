import React, { useContext, useState } from "react";
import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { MdAdd } from "react-icons/md";
import { BiMinus } from "react-icons/bi";

export function EditPage4({setJobModified}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [extras, updateExtras] = useState({ text: "", value: 0 });
  const { setSnackbarData } = useContext(SnackBarDataContext);
  

  function handleAdd() {
    const newExtrasArray = activeJob.job.costs.extrasCosts;
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
      job: {
        ...prevObj.job,
        costs: {
          ...prevObj.job.costs,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `Added`, severity: "success", autoHideDuration: 1000,
    }));
    setJobModified(true);
  };

  function handleRemove(extraID) {
    const extraIndex = activeJob.job.costs.extrasCosts.findIndex(
      (x) => x.id === extraID
    );
    const newExtrasArray = activeJob.job.costs.extrasCosts;
    let newTotal = 0;
    newExtrasArray.splice(extraIndex, 1);
    newExtrasArray.forEach((extra) => {
      newTotal += extra.extraValue;
    });
    updateActiveJob((prevObj) => ({
      ...prevObj,
      job: {
        ...prevObj.job,
        costs: {
          ...prevObj.job.costs,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `Deleted`, severity: "error", autoHideDuration: 1000,
    }));
    setJobModified(true);
  };

  return (
    <Container maxWidth={false} disableGutters={true}>
      <Grid container direction="row" xs={12}>
        <Grid xs={12} sm={6}>
          <Grid xs={12}>
            <Typography variant="body2">Extras List</Typography>
            <Divider />
            {activeJob.job.costs.extrasCosts.map((item) => {
              return (
                <Grid key={item.id} container direction="row">
                  <Grid xs={5}>
                    <Typography variant="body2">{item.extraText}</Typography>
                  </Grid>
                  <Grid xs={1}/>
                  <Grid xs={5}>
                    <Typography variant="body2">
                      {item.extraValue.toLocaleString()} ISK
                    </Typography>
                  </Grid>
                  <Grid xs={1}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleRemove(item.id)}
                    >
                      <BiMinus />
                    </IconButton>
                      </Grid>
                      <Grid sm={1}/>
                </Grid>
              );
            })}
          </Grid>
          <Divider />
        </Grid>
        <Grid container direction="row" xs={12} sm={6}>
          <Grid container direction="row" xs={12}>
            <Grid md={1}/>
            <Grid xs={5} md={3}>
              <TextField
                defaultValue={extras.text}
                variant="outlined"
                helperText="reminder"
                type="text"
                onBlur={(e) => {
                  updateExtras((prevState) => ({
                    ...prevState,
                    text: e.target.value,
                  }));
                }}
              />
            </Grid>
            <Grid xs={1} />
            <Grid xs={5} md={3}>
              <TextField
                defaultValue={extras.value}
                variant="outlined"
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
            <Grid xs={1}>
              <IconButton color="primary" onClick={() => handleAdd()}>
                <MdAdd />
              </IconButton>
            </Grid>
          </Grid>
          <Grid container direction="column" xs={12}>
            <Grid container="row" xs={6}>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total Items Built:{" "}
                  {activeJob.job.products.totalQuantity.toLocaleString()}
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total cost per item:{" "}
                  {Math.ceil(
                    (activeJob.job.costs.extrasTotal +
                      activeJob.job.costs.installCosts +
                      activeJob.job.costs.totalPurchaseCost) /
                      activeJob.job.products.totalQuantity
                  ).toLocaleString()}{" "}
                  ISK
                </Typography>
              </Grid>
            </Grid>
            <Grid container direction="row" xs={6}>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total Material Cost:{" "}
                  {activeJob.job.costs.totalPurchaseCost.toLocaleString()}{" "}
                  ISK
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Tooltip title="Calculated from linked jobs only, add any unlinked jobs manually as an extra.">
                <Typography variant="body2">
                    Total Install Costs: {" "}
                    {activeJob.job.costs.installCosts.toLocaleString()}{" "}
                    ISK
                </Typography>
                </Tooltip>
              </Grid>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total Extras:{" "}
                  {activeJob.job.costs.extrasTotal.toLocaleString()} ISK
                </Typography>
              </Grid>
              <Grid xs={12} sm>
                <Typography variant="body2">
                  Total Build Cost:{" "}
                  {(
                    activeJob.job.costs.totalPurchaseCost +
                    activeJob.job.costs.installCosts +
                    activeJob.job.costs.extrasTotal 
                  ).toLocaleString()}{" "}
                  ISK
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
