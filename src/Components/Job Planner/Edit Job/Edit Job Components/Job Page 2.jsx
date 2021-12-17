import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import React, { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { MdAdd } from "react-icons/md";
import { BiMinus } from "react-icons/bi";

export function EditPage2({setJobModified}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [inputs, setInputs] = useState({ itemCost: 0, itemCount: 0 });
  const { setSnackbarData } = useContext(SnackBarDataContext);

  let totalComplete = 0;

  activeJob.job.materials.forEach((material) => {
    if (material.quantityPurchased >= material.quantity) {
      totalComplete++;
    }
  });

  function handleAdd(material) {
    const materialIndex = activeJob.job.materials.findIndex(
      (x) => x.typeID === material.typeID
    );
    const newArray = activeJob.job.materials;
    let newTotal = 0;
    newArray[materialIndex].purchasing.push({
      id: Date.now(),
      itemCount: inputs.itemCount,
      itemCost: inputs.itemCost,
    });
    newArray[materialIndex].quantityPurchased += inputs.itemCount;
    newArray[materialIndex].purchasedCost += (inputs.itemCount * inputs.itemCost);
    if (
      newArray[materialIndex].quantityPurchased >=
      newArray[materialIndex].quantity
    ) {
      newArray[materialIndex].purchaseComplete = true;
    }
    updateActiveJob((prevObj) => ({
      ...prevObj,
      job: {
        ...prevObj.job,
        materials: newArray,
        products: {
          ...prevObj.job.products,
        },
        costs: {
          ...prevObj.job.costs,
          totalPurchaseCost: newTotal,
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
    setInputs({ itemCost: 0, itemCount: 0 });
    setJobModified(true);
  }

  function handleRemove(material, record) {
    const materialIndex = activeJob.job.materials.findIndex(
      (x) => x.typeID === material.typeID
    );
    const purchasingIndex = material.purchasing.findIndex(
      (i) => i.id === record.id
    );
    const newArray = activeJob.job.materials;
    let newTotal = 0;
    newArray[materialIndex].quantityPurchased -=
      newArray[materialIndex].purchasing[purchasingIndex].itemCount;
    newArray[materialIndex].purchasedCost -=
      (newArray[materialIndex].purchasing[purchasingIndex].itemCount * newArray[materialIndex].purchasing[purchasingIndex].itemCost);
    if (
      newArray[materialIndex].quantityPurchased <
      newArray[materialIndex].quantity
    ) {
      newArray[materialIndex].purchaseComplete = false;
    }
    newArray[materialIndex].purchasing.splice(purchasingIndex, 1);
    newArray.forEach((material) => {
      newTotal += material.purchasedCost;
    });
    updateActiveJob((prevObj) => ({
      ...prevObj,
      job: {
        ...prevObj.job,
        materials: newArray,
        products: {
          ...prevObj.job.products,
        },
        costs: {
          ...prevObj.job.costs,
          totalPurchaseCost: newTotal,
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
    <Container maxWidth="xl" disableGutters={true}>
      <Grid container direction="row">
        <Grid item xs={12}>
          {activeJob.job.materials.map((material) => {
            return (
              <>
                <Grid container direction="row">
                  <Grid item xs={9} sm={10}>
                    <Typography variant="h5">{material.name}</Typography>
                  </Grid>
                  <Grid item xs={3} sm={2}>
                    <Typography variant="h5">
                      {material.quantityPurchased.toLocaleString()}/
                      {material.quantity.toLocaleString()}
                    </Typography>
                    <Typography variant="h5"></Typography>
                  </Grid>
                  <Divider />
                  <Grid container direction="column">
                    {material.purchasing.map((record) => {
                      return (
                        <Grid container direction="row">
                          <Grid item xs={2} sm={2} md={1}>
                            <Typography variant="body2">
                              {record.itemCount.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} sm={2} md={1}>
                            <Typography variant="body2">
                              {record.itemCost.toLocaleString()} ISK
                            </Typography>
                          </Grid>
                          <Grid item xs={2} sm={2} md={1}>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => handleRemove(material, record)}
                            >
                              <BiMinus />
                            </IconButton>
                          </Grid>
                        </Grid>
                      );
                    })}
                  </Grid>
                  <Grid xs={12}>
                    <Typography variant="body2">
                      Add quantity of materials purchased and the price per item.
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={2} md={1}>
                    <TextField
                      defaultValue= "0"
                      variant="outlined"
                      helperText="Number of Items"
                      type="number"
                      onBlur={(e) => {
                        setInputs((prevState) => ({
                          ...prevState,
                          itemCount: Number(e.target.value),
                        }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={1} sm={2} md={1}></Grid>
                  <Grid item xs={4} sm={2} md={2}>
                    <TextField
                      defaultValue="0"
                      variant="outlined"
                      helperText="Price per Item"
                      type="number"
                      onBlur={(e) => {
                        setInputs((prevState) => ({
                          ...prevState,
                          itemCost: Number(e.target.value),
                        }));
                      }}
                    />
                  </Grid>
                  <Grid item xs={1} sm={2} md={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleAdd(material)}
                    >
                      <MdAdd />
                    </IconButton>
                  </Grid>
                </Grid>
                <Divider />
              </>
            );
          })}
        </Grid>
        <Grid xs={6}>
          <Typography variant="body2">
            {totalComplete}/
            {activeJob.job.materials.length} items fully purchased.{" "}
          </Typography>
        </Grid>
        <Grid xs={6}>
          <Typography variant="body2">
            Total material cost:{" "}
            {activeJob.job.costs.totalPurchaseCost.toLocaleString()} ISK
          </Typography>
        </Grid>
      </Grid>
    </Container>
  );
};