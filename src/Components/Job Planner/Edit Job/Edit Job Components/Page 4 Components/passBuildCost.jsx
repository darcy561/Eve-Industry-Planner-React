import { Button, Grid, Tooltip } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function PassBuildCostButton() {
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { downloadCharacterJobs, uploadJob, updateMainUserDoc } = useFirebase();
  const { updateJobSnapshot } = useJobManagement();
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const passCost = async () => {
    let itemsAdded = 0;
    let itemCost =
      Math.round(
        ((activeJob.build.costs.extrasTotal +
          activeJob.build.costs.installCosts +
          activeJob.build.costs.totalPurchaseCost) /
          activeJob.build.products.totalQuantity +
          Number.EPSILON) *
          100
      ) / 100;
    let availableForImport = activeJob.build.products.totalQuantity;
    let newJobArray = [...jobArray];
    for (let job of activeJob.parentJob) {
      let parentJob = newJobArray.find((i) => i.jobID === job);
      if (parentJob !== undefined) {
        let newTotal = 0;
        let quantityImported = 0;
        if (parentJob.isSnapshot) {
          parentJob = await downloadCharacterJobs(parentJob);
          parentJob.isSnapshot = false;
        }

        parentJob.build.materials.forEach((material) => {
          if (!material.purchasing.some((i) => i.childID === activeJob.jobID)) {
            if (material.childJob.includes(activeJob.jobID)) {
              if (availableForImport >= material.quantity) {
                quantityImported = material.quantity;
              } else {
                quantityImported = availableForImport;
              }
              itemsAdded++;
              availableForImport -= material.quantity;
              material.purchasing.push({
                id: Date.now(),
                childID: activeJob.jobID,
                childJobImport: true,
                itemCount: Number(quantityImported),
                itemCost: itemCost,
              });
              material.quantityPurchased = quantityImported;
              material.purchasedCost += quantityImported * itemCost;
              if (quantityImported >= material.quantity) {
                material.purchaseComplete = true;
              }
              newTotal += material.purchasedCost;
            }
          }
        });
        parentJob.build.costs.totalPurchaseCost += newTotal;
        if (isLoggedIn) {
          await uploadJob(parentJob);
        }
        updateJobSnapshot(parentJob);
        let index = newJobArray.findIndex((i) => i.jobID === parentJob.jobID);

        newJobArray[index] = parentJob;
      }
    }
    if (itemsAdded > 0) {
      if (itemsAdded === 1) {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `Cost Imported To Parent Job`,
          severity: "success",
          autoHideDuration: 3000,
        }));
      }
      if (itemsAdded > 1) {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `Cost Imported To ${itemsAdded} Jobs`,
          severity: "success",
          autoHideDuration: 3000,
        }));
      }
    } else {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Build cost already imported`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    }
    logEvent(analytics, "Import Costs", {
      UID: parentUser.accountID,
      isLoggedIn: isLoggedIn,
    });
    updateJobArray(newJobArray);
    updateMainUserDoc();
  };

  return (
    <Grid
      container
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="center">
        <Tooltip arrow title="Sends the item build cost to all parent jobs.">
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={passCost}
          >
            Send Build Costs
          </Button>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
