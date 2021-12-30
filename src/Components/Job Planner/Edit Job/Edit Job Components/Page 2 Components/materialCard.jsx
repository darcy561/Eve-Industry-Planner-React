import React, { useContext } from "react";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { AddMaterialCost } from "./addMaterialCost";
import { MaterialCost } from "./materialCost";

export function MaterialCard({ material, setJobModified }) {

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Paper
        sx={{
          padding: "20px",
          paddingTop: "10px",
          minHeight: { xs: "32vh", md: "30vh" },
        }}
        elevation={3}
        square={true}
      >
        <Container disableGutters={true}>
          <Grid container direction="row" sx={{ marginBottom: "15px" }}>
            <Grid item xs={12} align="center">
              <picture>
                <source
                  media="(max-width:700px)"
                  srcSet={`https://image.eveonline.com/Type/${material.typeID}_32.png`}
                  alt=""
                />
                <img
                  src={`https://image.eveonline.com/Type/${material.typeID}_64.png`}
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
                Items Purchased: {material.quantityPurchased.toLocaleString()} /{" "}
                {material.quantity.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ marginBottom: "10px" }}>
              <Typography variant="body2">
                Total Cost: {material.purchasedCost.toLocaleString()} ISK
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
