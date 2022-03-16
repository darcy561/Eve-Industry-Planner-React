import {
  Button,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { ShoppingListContext } from "../../../../../Context/LayoutContext";

export function PurchasingData() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateShoppingListData } = useContext(ShoppingListContext);
  const { buildShoppingList } = useJobManagement();

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
              {activeJob.build.costs.totalPurchaseCost.toLocaleString(undefined,{
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
            </Typography>
            <Typography>
              Current Cost Per Item:{" "}
              {(
                activeJob.build.costs.totalPurchaseCost /
                activeJob.build.products.totalQuantity
              ).toLocaleString(undefined,{
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Typography>
          </Grid>
          <Grid container item xs={6} md={4} align="center">
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      users[parentUserIndex].settings.editJob
                        .hideCompleteMaterials
                    }
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
                labelPlacement="start"
              />
            </Grid>
            {totalComplete < activeJob.build.materials.length &&(
            <Grid item xs={12} sx={{ marginTop: "10px" }}>
              <Tooltip
                title="Displays a shopping list of the remaining materials needed."
                arrow
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={async () => {
                    let shoppingList = await buildShoppingList([activeJob]);

                    updateShoppingListData((prev) => ({
                      open: true,
                      list: shoppingList,
                    }));
                  }}
                >
                  Shopping List
                </Button>
              </Tooltip>
              </Grid>
              )}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
