import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
<<<<<<< HEAD
import { Grid, IconButton, Tooltip, Typography } from "@mui/material";
import ClearIcon from '@mui/icons-material/Clear';
=======
import { Chip, Grid } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
>>>>>>> development

export function MaterialCost({ material, setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  function handleRemove(record) {
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
<<<<<<< HEAD
        minHeight: "8vh",
=======
        height: "8vh",
        overflowY:"auto"
>>>>>>> development
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
<<<<<<< HEAD
          >
            <Grid item xs="auto" align="center">
              <Typography variant="body2">
                {record.itemCount.toLocaleString()} @{" "}
                {record.itemCost.toLocaleString()} ISK Each
              </Typography>
            </Grid>
            <Grid item xs="auto" align="left">
              <Tooltip
                title="Removes the item cost row from the material"
                arrow
              >
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleRemove(material, record)}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
=======
            sx={{ marginBottom: "5px" }}
          >
            <Chip
              key={record.id}
              label={`${record.itemCount.toLocaleString(undefined,{
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })} @ ${record.itemCost.toLocaleString(undefined,{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} ISK Each`}
              variant="outlined"
              deleteIcon={<ClearIcon />}
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: "error.main",
                },
                boxShadow: 2,
              }}
              onDelete={() => handleRemove(record)}
              color={record.childJobImport ? "primary" : "secondary"}
            />
>>>>>>> development
          </Grid>
        );
      })}
    </Grid>
  );
}
