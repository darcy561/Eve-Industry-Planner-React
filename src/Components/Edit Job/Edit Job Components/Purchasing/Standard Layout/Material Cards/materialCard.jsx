import { useContext, useState } from "react";
import { Avatar, Box, Grid, Paper, Tooltip, Typography } from "@mui/material";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../../../../Context/AuthContext";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { MaterialCosts } from "./materialCosts";
import { AddMaterialCost_Purchasing } from "./addMaterialCosts";
import { AssetDialogue } from "../Assets Dialogue/assetsDialogue";
import { ChildJobDialogue } from "../Child Job Dialogue/childJobDialogue";

export function MaterialCard({
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
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { jobArray } = useContext(JobArrayContext);

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
      childJobs = filterJobs([...jobArray, Object.entries(temporaryChildJobs)]);
      childJobProductionTotal = childJobs.reduce(
        (total, job) => total + job.build.products.totalQuantity,
        0
      );
    }
  }

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
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
        <Grid container direction="row" sx={{ marginBottom: "15px" }}>
          {material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction ? (
            <Tooltip
              title="Number of child jobs linked, click to add or remove."
              arrow
              placement="top"
            >
              <Avatar
                variant="circle"
                sx={{
                  color: "white",
                  bgcolor: "primary.main",
                  height: "30px",
                  width: "30px",
                  position: "absolute",
                  top: "5px",
                  left: "5px",
                  cursor: "pointer",
                  boxShadow: 4,
                }}
                onClick={() => {
                  updateChildDialogTrigger(true);
                  setJobModified(true);
                }}
              >
                {childJobLocation.length}
              </Avatar>
            </Tooltip>
          ) : null}
          {isLoggedIn && (
            <Tooltip title="View Assets" arrow placement="top">
              <Avatar
                variant="circle"
                sx={{
                  color: "white",
                  bgcolor: "primary.main",
                  height: "30px",
                  width: "30px",
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  cursor: "pointer",
                  boxShadow: 4,
                }}
                onClick={async () => {
                  updateItemAssetsDialogTrigger(true);
                }}
              >
                A
              </Avatar>
            </Tooltip>
          )}
          <Grid item xs={12} align="center">
            <Avatar
              src={`https://images.evetech.net/types/${material.typeID}/icon?size=64`}
              alt={material.name}
              variant="square"
              sx={{ height: { xs: 32, sm: 64 }, width: { xs: 32, sm: 64 } }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sx={{
              minHeight: "3rem",
            }}
          >
            <Typography variant="subtitle2" align="center">
              {material.name}
            </Typography>
          </Grid>
        </Grid>
        <Grid container>
          {childJobProductionTotal < material.quantity && (
            <Grid item xs={12}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Remaining To Purchase:{" "}
                {(
                  material.quantity - material.quantityPurchased
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
            </Grid>
          )}
          {childJobLocation.length > 0 && (
            <Grid item xs={12}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                {childJobLocation.length > 1
                  ? "Child Jobs Production Total:"
                  : "Child Job Production Total:"}{" "}
                {childJobProductionTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} sx={{ marginBottom: "10px" }}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Total Cost:{" "}
              {material.purchasedCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ISK
            </Typography>
          </Grid>
          <MaterialCosts
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            materialIndex={materialIndex}
            material={material}
            setJobModified={setJobModified}
          />
          {material.quantityPurchased < material.quantity &&
            childJobProductionTotal < material.quantity && (
              <AddMaterialCost_Purchasing
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                materialIndex={materialIndex}
                material={material}
                setJobModified={setJobModified}
                marketDisplay={marketDisplay}
                orderDisplay={orderDisplay}
              />
            )}
          {material.quantityPurchased === material.quantity && (
            <Box
              sx={{
                backgroundColor: "manufacturing.main",
                borderRadius: "5px",
                marginLeft: "auto",
                marginRight: "auto",
                marginTop: "13px",
                padding: "8px",
              }}
            >
              <Typography variant="body1">Complete</Typography>
            </Box>
          )}
          {material.quantityPurchased < material.quantity &&
            childJobProductionTotal >= material.quantity && (
              <Box
                sx={{
                  marginLeft: "auto",
                  marginRight: "auto",
                  marginTop: "5px",
                  padding: "8px",
                }}
              >
                <Typography
                  sx={{ typography: { xs: "body1", sm: "h6" } }}
                  align="center"
                  color="primary"
                >
                  Awaiting Cost Import
                </Typography>
              </Box>
            )}
        </Grid>
      </Paper>
    </Grid>
  );
}
