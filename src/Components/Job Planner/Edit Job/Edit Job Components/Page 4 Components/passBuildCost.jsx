import { Button, Grid, Tooltip } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { IsLoggedInContext, UsersContext } from "../../../../../Context/AuthContext";

export function PassBuildCostButton() {
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { downloadCharacterJobs, uploadJob } = useFirebase();
  const analytics = getAnalytics();

  const parentUser = users.find((i) => i.ParentUser === true);

  const passCost = async () => {

    let itemsAdded = 0

    for (let job of activeJob.parentJob) {
      let parentJob = jobArray.find((i) => i.jobID === job);
      let newTotal = 0;
      if (parentJob.isSnapshot) {
        parentJob = await downloadCharacterJobs(parentJob);
        parentJob.isSnapshot = false;
      }
      parentJob.build.materials.forEach((material) => {
        if (!material.purchasing.some((i) => i.childID === activeJob.jobID)) {
          if (material.childJob.includes(activeJob.jobID)) {
            itemsAdded ++
            material.purchasing.push({
              id: Date.now(),
              childID: activeJob.jobID,
              childJobImport: true,
              itemCount: Number(material.quantity - material.quantityPurchased),
              itemCost:
                Math.round(
                  ((activeJob.build.costs.extrasTotal +
                    activeJob.build.costs.installCosts +
                    activeJob.build.costs.totalPurchaseCost) /
                    activeJob.build.products.totalQuantity +
                    Number.EPSILON) *
                  100
                ) / 100,
            })
            material.quantityPurchased = material.quantity
            material.purchasedCost += material.quantity * Math.round(
              ((activeJob.build.costs.extrasTotal +
                activeJob.build.costs.installCosts +
                activeJob.build.costs.totalPurchaseCost) /
                activeJob.build.products.totalQuantity +
                Number.EPSILON) *
              100
            ) / 100;
            material.purchaseComplete = true;
            newTotal += material.purchasedCost
          }
        }
        
      });
      parentJob.build.costs.totalPurchaseCost += newTotal
      await uploadJob(parentJob)
    }
    if (itemsAdded > 0) {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Costs Imported to ${itemsAdded} job/jobs`,
        severity: "success",
        autoHideDuration: 3000,
      }));
      logEvent(analytics, "Import Costs", {
        UID: parentUser.accountID,
        isLoggedIn: isLoggedIn
      })
    } else {
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `Build cost already imported`,
        severity: "error",
        autoHideDuration: 3000,
      }));
    }

  };

  return (
    <Grid
      container
      sx={{
        marginTop: "20px",
        marginBottom: "20px",
      }}
    >
      <Grid item xs={12} align="right">
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
