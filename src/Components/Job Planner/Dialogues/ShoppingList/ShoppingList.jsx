import { useContext, useEffect, useMemo, useState } from "react";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  Switch,
  Typography,
} from "@mui/material";
import CopyToClipboard from "react-copy-to-clipboard";
import { useJobManagement } from "../../../../Hooks/useJobManagement";
import { UsersContext } from "../../../../Context/AuthContext";
import { useCharAssets } from "../../../../Hooks/useCharAssets";

export function ShoppingListDialog({
  shoppingListTrigger,
  updateShoppingListTrigger,
  shoppingListData,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { buildShoppingList } = useJobManagement();
  const { findLocationAssets } = useCharAssets();
  const [childJobDisplay, updateChildJobDisplay] = useState(false);
  const [displayData, updateDisplayData] = useState([]);
  const [volumeTotal, updateVolumeTotal] = useState(0);
  const [copyText, updateCopyText] = useState("");
  const [loadingData, updateLoadingData] = useState(true);
  const [removeAssets, updateRemoveAssets] = useState(false);
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  useEffect(() => {
    async function createShoppingListDisplay() {
      if (shoppingListTrigger) {
        updateLoadingData(true);
        let newVolumeTotal = 0;
        let newCopyText = "";
        let newDisplayData = [];
        let shoppingList = await buildShoppingList(shoppingListData);
        let [fullAssetList, locationAssets] = await findLocationAssets(
          parentUser.settings.editJob.defaultAssetLocation
        );

        function calcVolume(listItem, assetQuantity) {
          if (removeAssets) {
            return listItem.volume * listItem.quantity - assetQuantity;
          } else {
            return listItem.volume * listItem.quantity;
          }
        }
        function buildCopyText(listItem) {
          if (removeAssets) {
            return `${listItem.name} ${listItem.quantityLessAsset}\n`;
          } else {
            return `${listItem.name} ${listItem.quantity}\n`;
          }
        }

        function assetQuantityVis(listItem, assetQuantity) {
          if (listItem.quantity - assetQuantity > 0) {
            return true;
          }
          return false;
        }

        function childVis(listItem) {
          if (!childJobDisplay && !listItem.hasChild) {
            return true;
          }
          return childJobDisplay;
        }

        function itemVis(listItem, assetQuantity) {
          let b = assetQuantityVis(listItem, assetQuantity);
          let c = childVis(listItem);
          if (removeAssets && b && c) {
            return true;
          }
          if (!removeAssets && c) {
            return true;
          }
          return false;
        }

        shoppingList.forEach((listItem) => {
          let assetType = locationAssets.find(
            (i) => i.type_id === listItem.typeID
          );
          let assetQuantity = 0;
          if (assetType !== undefined) {
            assetType.itemIDs.forEach((item) => {
              let asset = fullAssetList.find((m) => m.item_id === item);
              if (asset !== undefined) {
                assetQuantity += asset.quantity;
              }
            });
          }

          listItem.isVisible = itemVis(listItem, assetQuantity);
          listItem.quantityLessAsset = Math.max(
            listItem.quantity - assetQuantity,
            0
          );

          if (listItem.isVisible) {
            newVolumeTotal += calcVolume(listItem, assetQuantity);
            newCopyText = newCopyText.concat(buildCopyText(listItem));
            newDisplayData.push(listItem);
          }
        });
        updateDisplayData(newDisplayData);
        updateVolumeTotal(newVolumeTotal);
        updateCopyText(newCopyText);
        updateLoadingData(false);
      }
    }

    createShoppingListDisplay();
  }, [shoppingListTrigger, childJobDisplay, removeAssets]);

  const handleClose = () => {
    updateShoppingListTrigger(false);
    updateChildJobDisplay(false);
    updateRemoveAssets(false);
    updateDisplayData([]);
    updateLoadingData(true);
  };

  return (
    <Dialog
      open={shoppingListTrigger}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle
        id="ShoppingListDialog"
        align="center"
        sx={{ marginBottom: "10px" }}
        color="primary"
      >
        Shopping List
      </DialogTitle>
      <DialogContent>
        {!loadingData ? (
          <>
            <Grid container>
              {displayData.map((item) => {
                return (
                  <Grid
                    key={item.typeID}
                    container
                    item
                    xs={12}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ marginBottom: { xs: "1px", sm: "0px" } }}
                  >
                    <Grid
                      item
                      sm={1}
                      sx={{
                        display: { xs: "none", sm: "block" },
                        paddingRight: "5px",
                      }}
                      align="center"
                    >
                      <img
                        src={`https://images.evetech.net/types/${item.typeID}/icon?size=32`}
                        alt=""
                      />
                    </Grid>
                    <Grid item xs={8} sm={7}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body1" } }}
                      >
                        {item.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body1" } }}
                        align="right"
                      >
                        {removeAssets
                          ? item.quantityLessAsset.toLocaleString()
                          : item.quantity.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
            <Grid container sx={{ marginTop: "20px" }}>
              <Grid item xs={4}>
                <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
                  Total Volume
                </Typography>
              </Grid>
              <Grid item xs={8} align="right">
                <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
                  {volumeTotal.toLocaleString()} m3
                </Typography>
              </Grid>
            </Grid>
          </>
        ) : (
          <Grid container>
            <Grid item xs={12} align="center">
              <CircularProgress color="primary" />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <Grid container>
          <Grid container item xs={12}>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={removeAssets}
                      onChange={() => {
                        updateRemoveAssets((prev) => !prev);
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      Use character assets in quantity calculation
                    </Typography>
                  }
                  labelPlacement="bottom"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={6}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={childJobDisplay}
                      onChange={() => {
                        updateChildJobDisplay((prev) => !prev);
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      Include intermediary items
                    </Typography>
                  }
                  labelPlacement="bottom"
                />
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container item={12} sx={{ marginTop: "20px" }}>
            <Grid item sm={10} align="right">
              <CopyToClipboard
                text={copyText}
                onCopy={() => {
                  setSnackbarData((prev) => ({
                    ...prev,
                    open: true,
                    message: `Shopping List Copied`,
                    severity: "success",
                    autoHideDuration: 1000,
                  }));
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  Copy to Clipboard
                </Button>
              </CopyToClipboard>
            </Grid>
            <Grid item xs={12} sm={2} align="right">
              <Button onClick={handleClose} autoFocus>
                Close
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}
