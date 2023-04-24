import {
  Avatar,
  Box,
  Container,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import AddMaterialCost from "./addMaterialCost";
import { MaterialCost } from "./materialCost";
import { jobTypes } from "../../../../../Context/defaultValues";
import { ChildJobDialog } from "./childJobsDialog";
import { makeStyles } from "@mui/styles";
import { ItemAssetsDialogue } from "./itemAssetsDialog";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
} from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";

const useStyles = makeStyles((theme) => ({
  childJobText: {
    color: "white",
  },
}));

function MaterialCard({
  materialIndex,
  material,
  setJobModified,
  orderDisplay,
  marketDisplay,
}) {
  const [childDialogTrigger, updateChildDialogTrigger] = useState(false);
  const [itemAssetsDialogTrigger, updateItemAssetsDialogTrigger] =
    useState(false);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const classes = useStyles();
  let childJobs = [];
  let childJobProductionTotal = 0;

  if (material.childJob.length > 0) {
    if (activeJob.groupID === null) {
      childJobs = userJobSnapshot.filter((i) =>
        material.childJob.includes(i.jobID)
      );
      childJobs.forEach((i) => {
        childJobProductionTotal += i.itemQuantity;
      });
    } else {
      childJobs = jobArray.filter((i) => material.childJob.includes(i.jobID));
      childJobs.forEach((i) => {
        childJobProductionTotal += i.build.products.totalQuantity;
      });
    }
  }
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <ChildJobDialog
        material={material}
        childDialogTrigger={childDialogTrigger}
        updateChildDialogTrigger={updateChildDialogTrigger}
        setJobModified={setJobModified}
      />
      <ItemAssetsDialogue
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
        square={true}
      >
        <Container disableGutters={true}>
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
                  className={classes.childJobText}
                  sx={{
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
                  {material.childJob.length}
                </Avatar>
              </Tooltip>
            ) : null}
            {isLoggedIn && (
              <Tooltip title="View Assets" arrow placement="top">
                <Avatar
                  variant="circle"
                  className={classes.childJobText}
                  sx={{
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
              <picture>
                <source
                  media="(max-width:700px)"
                  srcSet={`https://images.evetech.net/types/${material.typeID}/icon?size=32`}
                  alt=""
                />
                <img
                  src={`https://images.evetech.net/types/${material.typeID}/icon?size=64`}
                  alt=""
                />
              </picture>
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
            {material.childJob.length > 0 && (
              <Grid item xs={12}>
                <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                  {material.childJob.length > 1
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
            <MaterialCost
              materialIndex={materialIndex}
              material={material}
              setJobModified={setJobModified}
            />
            {material.quantityPurchased < material.quantity &&
              childJobProductionTotal < material.quantity && (
                <AddMaterialCost
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
        </Container>
      </Paper>
    </Grid>
  );
}

export default MaterialCard;
