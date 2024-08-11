import { useContext } from "react";
import { Button, Tooltip } from "@mui/material";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import {
  FirebaseListenersContext,
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../../../../Context/AuthContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import updateJobInFirebase from "../../../../../../Functions/Firebase/updateJob";
import uploadJobSnapshotsToFirebase from "../../../../../../Functions/Firebase/uploadJobSnapshots";
import findOrGetJobObject from "../../../../../../Functions/Helper/findJobObject";
import manageListenerRequests from "../../../../../../Functions/Firebase/manageListenerRequests";
import getCurrentFirebaseUser from "../../../../../../Functions/Firebase/currentFirebaseUser";

export function PassBuildCostsButton({ activeJob }) {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { firebaseListeners, updateFirebaseListeners } = useContext(
    FirebaseListenersContext
  );
  const { sendSnackbarNotificationSuccess, sendSnackbarNotificationError } =
    useHelperFunction();
  const analytics = getAnalytics();

  async function passCost() {
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
    const retrievedJobs = [];
    for (let parentID of activeJob.parentJob) {
      let newTotal = 0;
      let quantityImported = 0;
      let parentJob = await findOrGetJobObject(
        parentID,
        jobArray,
        retrievedJobs
      );
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

      const matchedSnapshot = userJobSnapshot.find(
        (i) => i.jobID === parentJob.jobID
      );
      matchedSnapshot.setSnapshot(parentJob);
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
    manageListenerRequests(
      retrievedJobs,
      updateJobArray,
      updateFirebaseListeners,
      firebaseListeners,
      isLoggedIn
    );
    logEvent(analytics, "Import Costs", {
      UID: getCurrentFirebaseUser(),
      isLoggedIn: isLoggedIn,
    });
    updateUserJobSnapshot((prev) => [...prev]);
    updateJobArray((prev) => {
      const existingIDs = new Set(prev.map(({ jobID }) => jobID));
      return [
        ...prev,
        ...retrievedJobs.filter(({ jobID }) => !existingIDs.has(jobID)),
      ];
    });

    if (isLoggedIn) {
      await uploadJobSnapshotsToFirebase(newUserJobSnapshot);
    }
  }

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
