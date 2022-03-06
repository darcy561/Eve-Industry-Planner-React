import {
  Avatar,
  Box,
  Container,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import AddMaterialCost from "./addMaterialCost";
import { MaterialCost } from "./materialCost";
import { jobTypes } from "../../../JobPlanner";
import { ChildJobDialog } from "./childJobsDialog";

export function MaterialCard({ material, setJobModified }) {
  const [childDialogTrigger, updateChildDialogTrigger] = useState(false);

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <ChildJobDialog
        material={material}
        childDialogTrigger={childDialogTrigger}
        updateChildDialogTrigger={updateChildDialogTrigger}
        setJobModified={setJobModified}
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
                  }}
                >
                  {material.childJob.length}
                </Avatar>
              </Tooltip>
            ) : null}
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
            <Grid item xs={12} sx={{ marginBottom: "10px" }}>
              <Typography variant="body2">
                Items Purchased:{" "}
                {material.quantityPurchased.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{" "}
                / {material.quantity.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ marginBottom: "10px" }}>
              <Typography variant="body2">
                Total Cost:{" "}
                {material.purchasedCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                ISK
              </Typography>
            </Grid>
            <MaterialCost material={material} setJobModified={setJobModified} />
            {material.quantityPurchased < material.quantity ? (
              <AddMaterialCost
                material={material}
                setJobModified={setJobModified}
              />
            ) : (
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
          </Grid>
        </Container>
      </Paper>
    </Grid>
  );
}
