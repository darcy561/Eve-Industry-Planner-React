import { useContext, useState } from "react";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import { ZERO_TWO_DECIMAL_PLACES } from "../../../../../../Context/defaultValues";

export function AddMaterialCost_Purchasing({
  activeJob,
  updateActiveJob,
  materialIndex,
  material,
  setJobModified,
  marketDisplay,
  orderDisplay,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { findItemPriceObject } = useHelperFunction();
  const materialPrice = findItemPriceObject(material.typeID);
  const [itemCountInput, setItemCountInput] = useState(
    Number(material.quantity - material.quantityPurchased)
  );
  const [itemCostInput, setItemCostInput] = useState(
    materialPrice[marketDisplay][orderDisplay].toFixed(2)
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    if (itemCountInput <= 0) return;

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
          newQuantity: acc.newQuantity + itemCountInput,
          newPurchaseCost: acc.newPurchaseCost + itemCountInput * itemCostInput,
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
      itemCount: itemCountInput,
      itemCost: itemCostInput,
    });

    newArray[materialIndex].quantityPurchased += itemCountInput;
    newArray[materialIndex].purchasedCost += itemCountInput * itemCostInput;
    newTotal += itemCountInput * itemCostInput;

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
    setItemCostInput(0);
    setItemCountInput(0);
    setJobModified(true);
  };

  // function handleSubmit(event) {
  //   event.preventDefault();
  // }

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
            value={itemCountInput}
            inputProps={{ step: "1" }}
            onChange={(e) => {
              setItemCountInput(Number(e.target.value));
            }}
          />
        </Grid>
        <Grid item xs={4}>
          <Tooltip
            title={Number(itemCostInput).toLocaleString(
              undefined,
              ZERO_TWO_DECIMAL_PLACES
            )}
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
              value={itemCostInput}
              inputProps={{
                step: "0.01",
              }}
              onChange={(e) => {
                setItemCostInput(Number(e.target.value));
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
