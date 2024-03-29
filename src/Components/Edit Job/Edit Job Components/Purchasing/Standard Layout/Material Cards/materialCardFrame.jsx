import { Avatar, Grid, Paper, Typography } from "@mui/material";
import { ChildJobDialogue } from "../Child Job Dialogue/childJobDialogue";
import { AssetDialogue } from "../Assets Dialogue/assetsDialogue";
import { useContext, useState } from "react";
import { AssetsAvatar_Purchasing } from "./assetsAvatar";
import { ChildJobsAvatar_Purchasing } from "./childJobsAvatar";
import { RemainingToPurchase_Purchasing } from "./remainingToPurchase";
import { ChildJobProductionTotal_Purchasing } from "./childJobProductionTotal";
import { TotalCost_Purchasing } from "./totalMaterialCost";
import { MaterialCostsFrame_Purchasing } from "./materialCostsFrame";
import { AddMaterialCost_Purchasing } from "./addMaterialCosts";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { MaterialCompleteBox_Purchasing } from "./materialCompleteBox";
import { AwaitingCostImportBox_Purchasing } from "./awaitingCostImportBox";
import {
  STANDARD_TEXT_FORMAT,
  ZERO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";

export function MaterialCardFrame_Purchasing({
  activeJob,
  updateActiveJob,
  materialIndex,
  material,
  setJobModified,
  orderDisplay,
  marketDisplay,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const [childDialogTrigger, updateChildDialogTrigger] = useState(false);
  const [itemAssetsDialogTrigger, updateItemAssetsDialogTrigger] =
    useState(false);

  function calculateChildJobData() {
    let childJobs = [];
    let childJobProductionTotal = 0;
    const childJobLocation = [
      ...activeJob.build.childJobs[material.typeID],
      ...(temporaryChildJobs[material.typeID]
        ? [temporaryChildJobs[material.typeID].jobID]
        : []),
      ...(parentChildToEdit.childJobs[material.typeID]?.add
        ? parentChildToEdit.childJobs[material.typeID].add
        : []),
    ];

    if (childJobLocation.length > 0) {
      function filterJobs(jobList) {
        return jobList.filter((job) => childJobLocation.includes(job.jobID));
      }

      if (!activeJob.groupID) {
        childJobs = filterJobs(userJobSnapshot);
        childJobProductionTotal = childJobs.reduce(
          (total, job) => total + job.itemQuantity,
          0
        );
      } else {
        childJobs = filterJobs([
          ...jobArray,
          Object.entries(temporaryChildJobs),
        ]);
        childJobProductionTotal = childJobs.reduce((total, job) => {
          if (material.purchasing.some((i) => i.childID !== job.jobID)) {
            return total + job.build.products.totalQuantity;
          } else {
            return total;
          }
        }, 0);
        remainingTotalToBeImported = childJobs.reduce((total, job) => {
                  
        },0)
      }
    }
    return { childJobs, childJobProductionTotal, childJobLocation };
  }

  const { childJobs, childJobProductionTotal, childJobLocation } =
    calculateChildJobData();

  return (
    <Grid container item xs={12} sm={6} md={4} lg={3}>
      <ChildJobDialogue
        activeJob={activeJob}
        updateActiveJob={updateActiveJob}
        material={material}
        childDialogTrigger={childDialogTrigger}
        updateChildDialogTrigger={updateChildDialogTrigger}
        setJobModified={setJobModified}
        parentChildToEdit={parentChildToEdit}
        updateParentChildToEdit={updateParentChildToEdit}
        temporaryChildJobs={temporaryChildJobs}
      />
      <AssetDialogue
        material={material}
        itemAssetsDialogTrigger={itemAssetsDialogTrigger}
        updateItemAssetsDialogTrigger={updateItemAssetsDialogTrigger}
      />
      <Paper
        sx={{
          padding: "20px",
          paddingTop: "10px",
          minHeight: { xs: "32vh", md: "30vh" },
          position: "relative",
        }}
        elevation={3}
        square
      >
        <AssetsAvatar_Purchasing
          updateItemAssetsDialogTrigger={updateItemAssetsDialogTrigger}
        />
        <ChildJobsAvatar_Purchasing
          material={material}
          updateChildDialogTrigger={updateChildDialogTrigger}
          childJobs={childJobs}
        />

        <Grid container item sx={{ marginBottom: "15px" }}>
          <Grid item xs={12} align="center">
            <Avatar
              src={`https://images.evetech.net/types/${material.typeID}/icon?size=64`}
              alt={material.name}
              variant="square"
              sx={{ height: { xs: 32, sm: 64 }, width: { xs: 32, sm: 64 } }}
            />
          </Grid>
          <Grid item xs={12} sx={{ minHeight: "3rem" }}>
            <Typography variant="subtitle2" align="center">
              {material.name}
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12}>
            <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
              {`Quantity: ${material.quantity.toLocaleString(
                undefined,
                ZERO_DECIMAL_PLACES
              )}`}
            </Typography>
          </Grid>
          <ChildJobProductionTotal_Purchasing
            childJobs={childJobs}
            childJobLocation={childJobLocation}
            childJobProductionTotal={childJobProductionTotal}
          />
          <RemainingToPurchase_Purchasing
            material={material}
            childJobProductionTotal={childJobProductionTotal}
          />
          <TotalCost_Purchasing material={material} />
          <MaterialCostsFrame_Purchasing
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            materialIndex={materialIndex}
            material={material}
            setJobModified={setJobModified}
          />
          <AwaitingCostImportBox_Purchasing
            material={material}
            childJobs={childJobs}
            childJobProductionTotal={childJobProductionTotal}
          />
          <MaterialCompleteBox_Purchasing material={material} />
          <AddMaterialCost_Purchasing
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            materialIndex={materialIndex}
            material={material}
            setJobModified={setJobModified}
            marketDisplay={marketDisplay}
            orderDisplay={orderDisplay}
            childJobProductionTotal={childJobProductionTotal}
            childJobs={childJobs}
          />
        </Grid>
      </Paper>
    </Grid>
  );
}
