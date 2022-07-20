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
import { useContext, useMemo, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { ShoppingListContext } from "../../../../../Context/LayoutContext";
import {
  listingType,
  marketOptions,
} from "../../../../../Context/defaultValues";

export function PurchasingData({
  orderDisplay,
  changeOrderDisplay,
  marketDisplay,
  changeMarketDisplay,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { updateShoppingListData } = useContext(ShoppingListContext);
  const { buildShoppingList } = useJobManagement();
  const [orderSelect, updateOrderSelect] = useState(orderDisplay);
  const [marketSelect, updateMarketSelect] = useState(marketDisplay);

  const parentUserIndex = useMemo(() => {
    return users.findIndex((i) => i.ParentUser);
  }, [users, isLoggedIn]);

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
            <Grid item xs={12} md={4} sx={{marginBottom:{ xs:"20px", sm:"0px"}}}>
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
            </Grid>{" "}
            <Grid item xs={12} md={4} sx={{marginBottom:{xs:"20px", sm:"0px"}}}>
              {totalComplete < activeJob.build.materials.length && (
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
                  {marketOptions.map((option) => {
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
