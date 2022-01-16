import {
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";

export function PurchasingData({}) {
  const { activeJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);

  const parentUserIndex = users.findIndex((i) => i.ParentUser === true);

  let totalComplete = 0;

  activeJob.build.materials.forEach((material) => {
    if (material.quantityPurchased >= material.quantity) {
      totalComplete++;
    }
  });

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          padding: "20px",
        }}
        elevation={3}
        square={true}
      >
        <Grid container direction="row">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1">
              Total Complete Items: {totalComplete} /{" "}
              {activeJob.build.materials.length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1">
              Total Material Cost:{" "}
              {activeJob.build.costs.totalPurchaseCost.toLocaleString()} ISK
            </Typography>
          </Grid>
          <Grid item xs={6} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={users[parentUserIndex].settings.editJob.hideCompleteMaterials}
                  onChange={() => {
                    let newUsers = JSON.parse(JSON.stringify(users));
                    newUsers[
                      parentUserIndex
                    ].settings.editJob.hideCompleteMaterials =
                      !newUsers[parentUserIndex].settings.editJob
                        .hideCompleteMaterials;
                    updateUsers(newUsers);
                  }}
                />
              }
              label="Hide Completed Purchases"
            />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
