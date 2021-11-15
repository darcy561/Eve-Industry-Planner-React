import React, { useContext, useState } from "react";
import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { MdAdd } from "react-icons/md";
import { BiMinus } from "react-icons/bi";

export function EditPage4() {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [extras, updateExtras] = useState({ text: "", value: 0 });
  const { setSnackbarData } = useContext(SnackBarDataContext);
  

  function handleAdd() {
    const newExtrasArray = activeJob.job.products.extrasCosts;
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
        products: {
          ...prevObj.job.products,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `Added`, severity: "success", autoHideDuration: 1000,
    }));
  }

  function handleRemove(extraID) {
    const extraIndex = activeJob.job.products.extrasCosts.findIndex(
      (x) => x.id === extraID
    );
    const newExtrasArray = activeJob.job.products.extrasCosts;
    let newTotal = 0;
    newExtrasArray.splice(extraIndex, 1);
    newExtrasArray.forEach((extra) => {
      newTotal += extra.extraValue;
    });
    updateActiveJob((prevObj) => ({
      ...prevObj,
      job: {
        ...prevObj.job,
        products: {
          ...prevObj.job.products,
          extrasCosts: newExtrasArray,
          extrasTotal: newTotal,
        },
      },
    }));
    setSnackbarData((prev) => ({
      ...prev, open: true, message: `Deleted`, severity: "error", autoHideDuration: 1000,
    }));
  }

  return (
    <Container maxWidth={false} disableGutters={true}>
      <Grid container direction="row" xs={12}>
        <Grid xs={12} sm={6}>
          <Grid xs={12}>
            <Typography variant="body2">Extras List</Typography>
            <Divider />
            {activeJob.job.products.extrasCosts.map((item) => {
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
                    (activeJob.job.products.extrasTotal +
                      activeJob.job.products.totalPurchaseCost) /
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
                  {activeJob.job.products.totalPurchaseCost.toLocaleString()}{" "}
                  ISK
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total Job Install Costs: (TBC)
                </Typography>
              </Grid>
              <Grid xs={12}>
                <Typography variant="body2">
                  Total Extras:{" "}
                  {activeJob.job.products.extrasTotal.toLocaleString()} ISK
                </Typography>
              </Grid>
              <Grid xs={12} sm>
                <Typography variant="body2">
                  Total Build Cost:{" "}
                  {(
                    activeJob.job.products.totalPurchaseCost +
                    activeJob.job.products.extrasTotal
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
