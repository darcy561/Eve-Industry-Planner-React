import { useContext, useState } from "react";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { EvePricesContext } from "../../../../../../Context/EveDataContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";

export function AddMaterialCost({
  activeJob,
  updateActiveJob,
  materialIndex,
  material,
  setJobModified,
  marketDisplay,
  orderDisplay,
}) {
  const { evePrices } = useContext(EvePricesContext);
  const materialPrice = evePrices.find((i) => i.typeID === material.typeID);
  const [inputs, setInputs] = useState({
    itemCost: materialPrice[marketDisplay][orderDisplay].toFixed(2),
    itemCount: Number(material.quantity - material.quantityPurchased),
  });
  const { setSnackbarData } = useContext(SnackBarDataContext);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (inputs.itemCount <= 0) return;

    let newArray = [...activeJob.build.materials];
    let newTotal = activeJob.build.costs.totalPurchaseCost;

    const hasInvalidQuantityOrCost = newArray[materialIndex].purchasing.some(
      (entry) =>
        isNaN(entry.itemCount) ||
        entry.itemCount < 0 ||
        isNaN(entry.itemCost) ||
        entry.itemCost < 0
    );

    if (hasInvalidQuantityOrCost) {
      const { newQuantity, newPurchaseCost } = newArray[
        materialIndex
      ].purchasing.reduce(
        (acc, entry) => ({
          newQuantity: acc.newQuantity + entry.itemCount,
          newPurchaseCost:
            acc.newPurchaseCost + entry.itemCount * entry.itemCost,
        }),
        { newQuantity: 0, newPurchaseCost: 0 }
      );

      newArray[materialIndex].quantityPurchased = newQuantity;
      newArray[materialIndex].purchasedCost = newPurchaseCost;
    }

    const hasInvalidTotalPurchaseCost = isNaN(newTotal) || newTotal < 0;

    if (hasInvalidTotalPurchaseCost) {
      newTotal = newArray.reduce((acc, entry) => acc + entry.purchasedCost, 0);
    }

    newArray[materialIndex].purchasing.push({
      id: Date.now(),
      childID: null,
      childJobImport: false,
      itemCount: inputs.itemCount,
      itemCost: Number(inputs.itemCost),
    });

    newArray[materialIndex].quantityPurchased += inputs.itemCount;
    newArray[materialIndex].purchasedCost += inputs.itemCount * inputs.itemCost;
    newTotal += inputs.itemCount * inputs.itemCost;

    if (
      newArray[materialIndex].quantityPurchased >=
      newArray[materialIndex].quantity
    ) {
      newArray[materialIndex].purchaseComplete = true;
    }

    updateActiveJob((prevObj) => ({
      ...prevObj,
      build: {
        ...prevObj.build,
        materials: newArray,
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
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <TextField
            sx={{
              "& .MuiFormHelperText-root": {
                color: (theme) => theme.palette.secondary.main,
              },
              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                {
                  display: "none",
                },
            }}
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
          <Tooltip
            title={Number(inputs.itemCost).toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
            arrow
            placement="top"
          >
            <TextField
              sx={{
                "& .MuiFormHelperText-root": {
                  color: (theme) => theme.palette.secondary.main,
                },
                "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                  {
                    display: "none",
                  },
              }}
              required={true}
              size="small"
              variant="standard"
              type="number"
              helperText="Item Price"
              value={inputs.itemCost}
              inputProps={{
                step: "0.01",
              }}
              onChange={(e) => {
                setInputs((prevState) => ({
                  ...prevState,
                  itemCost: Number(e.target.value),
                }));
              }}
            />
          </Tooltip>
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
