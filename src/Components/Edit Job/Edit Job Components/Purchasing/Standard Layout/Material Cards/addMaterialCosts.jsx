import { useState } from "react";
import { Grid, IconButton, TextField, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import { ZERO_TWO_DECIMAL_PLACES } from "../../../../../../Context/defaultValues";
import {
  useAddMaterialCostsToJob,
  useBuildMaterialPriceObject,
} from "../../../../../../Hooks/JobHooks/useAddMaterialCosts";

export function AddMaterialCost_Purchasing({
  activeJob,
  updateActiveJob,
  material,
  setJobModified,
  marketDisplay,
  orderDisplay,
  childJobProductionTotal,
  childJobs,
}) {
  const { findItemPriceObject, sendSnackbarNotificationSuccess } =
    useHelperFunction();
  const materialPrice = findItemPriceObject(material.typeID);
  const [itemCountInput, setItemCountInput] = useState(
    Number(material.quantity - material.quantityPurchased)
  );
  const [itemCostInput, setItemCostInput] = useState(
    Number(materialPrice[marketDisplay][orderDisplay].toFixed(2))
  );

  function handleSubmit(event) {
    event.preventDefault();
    if (itemCountInput <= 0) return;
    const { newMaterialArray, newTotalPurchaseCost } = useAddMaterialCostsToJob(
      activeJob,
      [
        useBuildMaterialPriceObject(
          material.typeID,
          itemCountInput,
          itemCostInput
        ),
      ]
    );

    updateActiveJob((prevObj) => ({
      ...prevObj,
      build: {
        ...prevObj.build,
        materials: newMaterialArray,
        costs: {
          ...prevObj.build.costs,
          totalPurchaseCost: newTotalPurchaseCost,
        },
      },
    }));
    sendSnackbarNotificationSuccess("Success");
    setItemCostInput(0);
    setItemCountInput(0);
    setJobModified(true);
  }

  if (material.quantityPurchased >= material.quantity) return null;

  if (childJobs.length > 0) {
    if (
      childJobProductionTotal + material.quantityPurchased >=
      material.quantity
    )
      return null;
  }

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
