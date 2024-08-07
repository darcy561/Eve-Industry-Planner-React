import { Chip, Grid } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import Job from "../../../../../../Classes/jobConstructor";

export function MaterialCosts({
  activeJob,
  updateActiveJob,
  materialIndex,
  material,
  setJobModified,
}) {
  const { sendSnackbarNotificationError } = useHelperFunction();

  function handleRemove(purchasingIndex) {
    const newArray = [...activeJob.build.materials];
    let newTotal = activeJob.build.costs.totalPurchaseCost;
    let material = newArray[materialIndex];
    const itemCost = material.purchasing[purchasingIndex].itemCost;
    const itemCount = material.purchasing[purchasingIndex].itemCount;
    const hasInvalidQuantityOrCost = material.purchasing.some(
      (entry) =>
        isNaN(entry.itemCount) ||
        entry.itemCount < 0 ||
        isNaN(entry.itemCost) ||
        entry.itemCost < 0
    );
    const hasInvalidTotalPurchaseCost = isNaN(newTotal) || newTotal < 0;

    if (hasInvalidQuantityOrCost) {
      const { newQuantity, newPurchaseCost } = material.purchasing.reduce(
        (acc, entry) => ({
          newQuantity: acc.newQuantity + entry.itemCount,
          newPurchaseCost:
            acc.newPurchaseCost + entry.itemCount * entry.itemCost,
        }),
        { newQuantity: 0, newPurchaseCost: 0 }
      );

      material.quantityPurchased = newQuantity;
      material.purchasedCost = newPurchaseCost;
    }
    if (hasInvalidTotalPurchaseCost) {
      newTotal = newArray.reduce((acc, entry) => acc + entry.purchasedCost, 0);
    }

    material.quantityPurchased -= itemCount;
    material.purchasedCost -= itemCount * itemCost;
    newTotal -= itemCount * itemCost;
    if (material.quantityPurchased < material.quantity) {
      material.purchaseComplete = false;
    }

    material.purchasing = material.purchasing.filter(
      (item, index) => index !== purchasingIndex
    );

    if (material.purchasing.length === 0) {
      if (material.quantityPurchased !== 0 || material.purchasedCost !== 0) {
        material.quantityPurchased = 0;
        material.purchasedCost = 0;

        newTotal = newArray.reduce(
          (acc, entry) => acc + entry.purchasedCost,
          0
        );
      }
    }
    activeJob.build.materials = newArray;
    activeJob.build.costs.totalPurchaseCost = newTotal;
    updateActiveJob((prev) => new Job(prev));
    sendSnackbarNotificationError("Deleted");
    setJobModified(true);
  }

  return (
    <Grid
      container
      sx={{
        height: "8vh",
        overflowY: "auto",
      }}
    >
      {material.purchasing.map((record, recordIndex) => {
        return (
          <Grid
            key={record.id}
            container
            item
            justifyContent="center"
            alignItems="center"
            sx={{ marginBottom: "5px" }}
          >
            <Chip
              label={`${record.itemCount.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} @ ${record.itemCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ISK Each`}
              variant="outlined"
              deleteIcon={<ClearIcon />}
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: "error.main",
                },
                boxShadow: 2,
              }}
              onDelete={() => handleRemove(recordIndex)}
              color={record.childJobImport ? "primary" : "secondary"}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
