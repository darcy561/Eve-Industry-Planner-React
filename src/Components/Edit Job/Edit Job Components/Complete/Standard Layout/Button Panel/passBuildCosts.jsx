import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../../../../Context/AuthContext";
import { useFindJobObject } from "../../../../../../Hooks/GeneralHooks/useFindJobObject";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import updateJobInFirebase from "../../../../../../Functions/Firebase/updateJob";
import uploadJobSnapshotsToFirebase from "../../../../../../Functions/Firebase/uploadJobSnapshots";

export function PassBuildCostsButton({ activeJob }) {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { findJobData } = useFindJobObject();
  const {
    findParentUser,
    sendSnackbarNotificationSuccess,
    sendSnackbarNotificationError,
  } = useHelperFunction();
  const analytics = getAnalytics();

  const parentUser = findParentUser();

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
    let newUserJobSnapshot = [...userJobSnapshot];
    for (let job of activeJob.parentJob) {
      let newTotal = 0;
      let quantityImported = 0;
      let parentJob = await findJobData(job, newUserJobSnapshot, newJobArray);
      if (!parentJob) {
        continue;
      }
      let material = parentJob.build.materials.find(
        (i) => i.typeID === activeJob.itemID
      );
      if (!material) {
        continue;
      }
      if (
        material.purchasing.some((i) => i.childID === activeJob.jobID) &&
        parentJob.build.childJobs[material.typeID].includes(activeJob.jobID)
      ) {
        continue;
      }

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
      material.quantityPurchased += quantityImported;
      material.purchasedCost += quantityImported * itemCost;
      if (quantityImported >= material.quantity) {
        material.purchaseComplete = true;
      }
      newTotal += material.purchasedCost;

      parentJob.build.costs.totalPurchaseCost += newTotal;
      if (isLoggedIn) {
        await updateJobInFirebase(parentJob);
      }

      const matchedSnapshot = newUserJobSnapshot.find(
        (i) => i.jobID === parentJob.jobID
      );
      matchedSnapshot.setSnapshot(parentJob);

      let index = newJobArray.findIndex((i) => i.jobID === parentJob.jobID);
      if (index !== -1) {
        newJobArray[index] = parentJob;
      }
    }
    if (itemsAdded > 0) {
      const messageText =
        itemsAdded > 1
          ? `Cost Imported To ${itemsAdded} Jobs`
          : `Cost Imported To Parent Job`;

      sendSnackbarNotificationSuccess(messageText);
    } else {
      sendSnackbarNotificationError(`Build cost already imported`, 3);
    }
    logEvent(analytics, "Import Costs", {
      UID: parentUser.accountID,
      isLoggedIn: isLoggedIn,
    });
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
    }
  };

  if (activeJob.parentJob.length === 0) {
    return null;
  }

  return (
    <Tooltip arrow title="Sends the item build cost to all parent jobs.">
      <Button
        color="primary"
        variant="contained"
        size="small"
        onClick={passCost}
        sx={{ margin: "10px" }}
      >
        Send Build Costs
      </Button>
    </Tooltip>
  );
}
