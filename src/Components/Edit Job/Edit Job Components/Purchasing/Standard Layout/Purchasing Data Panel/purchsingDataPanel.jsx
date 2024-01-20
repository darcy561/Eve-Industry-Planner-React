import { useContext, useMemo, useState } from "react";
import {
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  IsLoggedInContext,
  UsersContext,
<<<<<<< HEAD:src/Components/Job Planner/Edit Job/Edit Job Components/Page 2 Components/purchasingData.jsx
} from "../../../../../Context/AuthContext";
import {
  listingType
} from "../../../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../../../global-config-app";
=======
} from "../../../../../../Context/AuthContext";
import { listingType } from "../../../../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../../../../global-config-app";
import { ShoppingListContext } from "../../../../../../Context/LayoutContext";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569:src/Components/Edit Job/Edit Job Components/Purchasing/Standard Layout/Purchasing Data Panel/purchsingDataPanel.jsx

export function PurchasingDataPanel_EditJob({
  activeJob,
  updateActiveJob,
  orderDisplay,
  changeOrderDisplay,
  marketDisplay,
  changeMarketDisplay,
<<<<<<< HEAD:src/Components/Job Planner/Edit Job/Edit Job Components/Page 2 Components/purchasingData.jsx
  updateShoppingListTrigger,
  updateShoppingListData,
=======
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569:src/Components/Edit Job/Edit Job Components/Purchasing/Standard Layout/Purchasing Data Panel/purchsingDataPanel.jsx
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateShoppingListTrigger, updateShoppingListData } =
    useContext(ShoppingListContext);
  const [orderSelect, updateOrderSelect] = useState(orderDisplay);
  const [marketSelect, updateMarketSelect] = useState(marketDisplay);
  const { MARKET_OPTIONS } = GLOBAL_CONFIG;

  const parentUserIndex = useMemo(() => {
    return users.findIndex((i) => i.ParentUser);
  }, [users, isLoggedIn]);

  const totalComplete = activeJob.build.materials.reduce((acc, mat) => {
    if (mat.purchaseComplete) {
      acc++;
    }
    return acc;
  }, 0);

  return (
    <Grid item xs={12}>
      <Paper
        sx={{
          padding: "20px",
        }}
        elevation={3}
        square
      >
        <Grid container direction="row" align="center">
          <Grid container item xs={12}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
                Total Complete Items: {totalComplete} /{" "}
                {activeJob.build.materials.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Total Material Cost:{" "}
                {activeJob.build.costs.totalPurchaseCost.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
                Current Cost Per Item:{" "}
                {(
                  activeJob.build.costs.totalPurchaseCost /
                  activeJob.build.products.totalQuantity
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid
              item
              xs={12}
              md={4}
              sx={{ marginBottom: { xs: "20px", sm: "0px" } }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      users[parentUserIndex].settings.editJob
                        .hideCompleteMaterials
                    }
                    onChange={() => {
<<<<<<< HEAD:src/Components/Job Planner/Edit Job/Edit Job Components/Page 2 Components/purchasingData.jsx
                      let newUsers = [...users]
=======
                      let newUsers = [...users];
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569:src/Components/Edit Job/Edit Job Components/Purchasing/Standard Layout/Purchasing Data Panel/purchsingDataPanel.jsx
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
            </Grid>{" "}
            <Grid
              item
              xs={12}
              md={4}
              sx={{ marginBottom: { xs: "20px", sm: "0px" } }}
            >
              {totalComplete < activeJob.build.materials.length && (
                <Tooltip
                  title="Displays a shopping list of the remaining materials needed."
                  arrow
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={async () => {
                      updateShoppingListData([activeJob.jobID]);
                      updateShoppingListTrigger((prev) => !prev);
                    }}
                  >
                    Shopping List
                  </Button>
                </Tooltip>
              )}
            </Grid>
            <Grid container item xs={12} md={4}>
              <Grid item xs={6}>
                <Select
                  value={marketSelect}
                  variant="standard"
                  size="small"
                  onChange={(e) => {
                    changeMarketDisplay(e.target.value);
                    updateMarketSelect(e.target.value);
                    updateActiveJob((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        localMarketDisplay: e.target.value,
                      },
                    }));
                  }}
                  sx={{
                    width: "90px",
                    marginRight: "5px",
                  }}
                >
                  {MARKET_OPTIONS.map((option) => {
                    return (
                      <MenuItem key={option.name} value={option.id}>
                        {option.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <Select
                  value={orderSelect}
                  variant="standard"
                  size="small"
                  onChange={(e) => {
                    changeOrderDisplay(e.target.value);
                    updateOrderSelect(e.target.value);
                    updateActiveJob((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        localOrderDisplay: e.target.value,
                      },
                    }));
                  }}
                  sx={{
                    width: "120px",
                    marginLeft: "5px",
                  }}
                >
                  {listingType.map((option) => {
                    return (
                      <MenuItem key={option.name} value={option.id}>
                        {option.name}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
