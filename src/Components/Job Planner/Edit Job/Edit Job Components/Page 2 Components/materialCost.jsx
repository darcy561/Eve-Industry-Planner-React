import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { Chip, Grid } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

export function MaterialCost({ material, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  function handleRemove(material, record) {
    const materialIndex = activeJob.build.materials.findIndex(
      (x) => x.typeID === material.typeID
    );
    const purchasingIndex = material.purchasing.findIndex(
      (i) => i.id === record.id
    );
    const newArray = activeJob.build.materials;
    let newTotal = 0;
    newArray[materialIndex].quantityPurchased -=
      newArray[materialIndex].purchasing[purchasingIndex].itemCount;
    newArray[materialIndex].purchasedCost -=
      newArray[materialIndex].purchasing[purchasingIndex].itemCount *
      newArray[materialIndex].purchasing[purchasingIndex].itemCost;
    if (
      newArray[materialIndex].quantityPurchased <
      newArray[materialIndex].quantity
    ) {
      newArray[materialIndex].purchaseComplete = false;
    }
    if (purchasingIndex !== -1 && materialIndex !== -1) {
      newArray[materialIndex].purchasing.splice(purchasingIndex, 1);
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
      message: `Deleted`,
      severity: "error",
      autoHideDuration: 1000,
    }));
    setJobModified(true);
  }

  return (
    <Grid
      container
      direction="row"
      sx={{
        minHeight: "8vh",
      }}
    >
      {material.purchasing.map((record) => {
        return (
          <Grid
            key={record.id}
            container
            direction="row"
            item
            justifyContent="center"
            alignItems="center"
            sx={{ marginBottom: "5px" }}
          >
            <Chip
              key={record.id}
              label={`${record.itemCount.toLocaleString()} @ ${record.itemCost.toLocaleString()} ISK Each`}
              variant="outlined"
              deleteIcon={<ClearIcon />}
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: "error.main",
                },
                boxShadow: 0,
              }}
              onDelete={() => handleRemove(material, record)}
              color={record.childJobImport ? "success" : "secondary"}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
