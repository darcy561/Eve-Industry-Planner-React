import React, { memo, useContext, useEffect, useState } from "react";
import { Grid, IconButton, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { makeStyles } from "@mui/styles";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { UsersContext } from "../../../../../Context/AuthContext";

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

export function AddMaterialCost({
  material,
  setJobModified,
  marketDisplay,
  orderDisplay,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { evePrices } = useContext(EvePricesContext);
  const materialPrice = evePrices.find((i) => i.typeID === material.typeID);
  const [inputs, setInputs] = useState({
    itemCost: materialPrice[marketDisplay][orderDisplay].toFixed(2),
    itemCount: Number(material.quantity - material.quantityPurchased),
  });
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const classes = useStyles();

  useEffect(() => {
    setInputs((prev) => ({
      ...prev,
      itemCost: materialPrice[marketDisplay][orderDisplay].toFixed(2),
    }));
  }, [marketDisplay, orderDisplay]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputs.itemCount > 0) {
      const materialIndex = activeJob.build.materials.findIndex(
        (x) => x.typeID === material.typeID
      );
      const newArray = activeJob.build.materials;
      let newTotal = 0;
      newArray[materialIndex].purchasing.push({
        id: Date.now(),
        childID: null,
        childJobImport: false,
        itemCount: inputs.itemCount,
        itemCost: inputs.itemCost,
      });
      newArray[materialIndex].quantityPurchased += inputs.itemCount;
      newArray[materialIndex].purchasedCost +=
        inputs.itemCount * inputs.itemCost;
      if (
        newArray[materialIndex].quantityPurchased >=
        newArray[materialIndex].quantity
      ) {
        newArray[materialIndex].purchaseComplete = true;
      }

      newArray.forEach((material) => {
        newTotal += material.purchasedCost;
      });

      updateActiveJob((prevObj) => ({
        ...prevObj,
        build: {
          ...prevObj.build,
          materials: newArray,
          products: {
            ...prevObj.build.products,
          },
          costs: {
            ...prevObj.build.costs,
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
    } else {
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <TextField
            className={classes.TextField}
            required={true}
            size="small"
            variant="standard"
            type="number"
            helperText="Item Quantity"
            defaultValue={inputs.itemCount}
            inputProps={{ step: "1" }}
            onChange={(e) => {
              setInputs((prevState) => ({
                ...prevState,
                itemCount: Number(e.target.value),
              }));
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            className={classes.TextField}
            required={true}
            size="small"
            variant="standard"
            type="number"
            helperText="Item Price"
            value={materialPrice[marketDisplay][orderDisplay].toFixed(2)}
            inputProps={{
              step: "0.01",
            }}
            onChange={(e) => {
              setInputs((prevState) => ({
                ...prevState,
                itemCost: e.target.value,
              }));
            }}
          />
        </Grid>
        <Grid item xs={1} align="center">
          <IconButton size="small" color="primary" type="submit">
            <AddIcon />
          </IconButton>
        </Grid>
      </Grid>
    </form>
  );
}
