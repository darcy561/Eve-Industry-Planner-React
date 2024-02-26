import { Avatar, Grid, Paper, Typography } from "@mui/material";
import { ChildJobDialogue } from "../Child Job Dialogue/childJobDialogue";
import { AssetDialogue } from "../Assets Dialogue/assetsDialogue";
import { useState } from "react";
import { AssetsAvatar_Purchasing } from "./assetsAvatar";
import { ChildJobsAvatar_Purchasing } from "./childJobsAvatar";
import { RemainingToPurchase_Purchasing } from "./remainingToPurchase";
import { ChildJobProductionTotal_Purchasing } from "./childJobProductionTotal";
import { TotalCost_Purchasing } from "./totalMaterialCost";
import { MaterialCostsFrame, MaterialCostsFrame_Purchasing } from "./materialCostsFrame";

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
  const [childDialogTrigger, updateChildDialogTrigger] = useState(false);
  const [itemAssetsDialogTrigger, updateItemAssetsDialogTrigger] =
    useState(false);

  let childJobs = [];
  let childJobProductionTotal = 0;
  const childJobLocation = [];

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
        <ChildJobsAvatar_Purchasing material={material} />

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
          <RemainingToPurchase_Purchasing
            material={material}
            childJobProductionTotal={childJobProductionTotal}
          />
          <ChildJobProductionTotal_Purchasing
            childJobLocation={childJobLocation}
            childJobProductionTotal={childJobProductionTotal}
          />
          <TotalCost_Purchasing material={material} />
          <MaterialCostsFrame_Purchasing/>
        </Grid>
      </Paper>
    </Grid>
  );
}
