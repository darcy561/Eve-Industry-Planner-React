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
import { EveIDsContext } from "../../../../Context/EveDataContext";

export function ShoppingListDialog({
  shoppingListTrigger,
  updateShoppingListTrigger,
  shoppingListData,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { buildShoppingList } = useJobManagement();
  const { findLocationAssets } = useCharAssets();
  const [childJobDisplay, updateChildJobDisplay] = useState(false);
  const [displayData, updateDisplayData] = useState([]);
  const [volumeTotal, updateVolumeTotal] = useState(0);
  const [copyText, updateCopyText] = useState("");
  const [loadingData, updateLoadingData] = useState(true);
  const [removeAssets, updateRemoveAssets] = useState(false);
  const [newEveIDs, updateNewEveIDs] = useState([]);
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  useEffect(() => {
    async function createShoppingListDisplay() {
      if (shoppingListTrigger) {
        let newVolumeTotal = 0;
        let newCopyText = "";
        let newDisplayData = [];
        let shoppingList = await buildShoppingList(shoppingListData);
        let [fullAssetList, locationAssets] = await findLocationAssets(
          parentUser.settings.editJob.defaultAssetLocation
        );
        shoppingList.forEach((listItem) => {
          // if (childJobDisplay) {
          //   newCopyText = newCopyText.concat(`${listItem.name} ${listItem.quantity}\n`);
          //   newVolumeTotal += listItem.volume * listItem.quantity;
          //   newDisplayData = shoppingList;
          // }
          // if (!childJobDisplay) {
          //   if (!listItem.hasChild) {
          //     newCopyText = newCopyText.concat(`${listItem.name} ${listItem.quantity}\n`);
          //     newVolumeTotal += listItem.volume * listItem.quantity;
          //     newDisplayData = shoppingList.filter((i) => !i.hasChild);
          //   }
          // }

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

            newCopyText = newCopyText.concat(
              `${listItem.name} ${Math.max(
                listItem.quantity - assetQuantity,
                0
              )}\n`
            );

            newVolumeTotal +=
              listItem.volume * Math.max(listItem.quantity - assetQuantity, 0);

            if (childJobDisplay) {
              newDisplayData = shoppingList;
              listItem.quantityLessAsset = Math.max(
                listItem.quantity - assetQuantity,
                0
              );
            } else {
              if (!listItem.hasChild) {
                newDisplayData = shoppingList.filter((i) => !i.hasChild);
              }
            }

            listItem.quantityLessAsset = Math.max(
              listItem.quantity - assetQuantity,
              0
            );
          }
        });
        console.log(newDisplayData);
        updateDisplayData(newDisplayData);
        updateVolumeTotal(newVolumeTotal);
        updateCopyText(newCopyText);
        updateLoadingData(false);
        // updateNewEveIDs(tempNewEveIDs)
      }
    }

    createShoppingListDisplay();
  }, [childJobDisplay, removeAssets]);

  const handleClose = () => {
    updateShoppingListTrigger(true);
    updateDisplayData([]);
    updateLoadingData(true);
    updateEveIDs(newEveIDs);
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
        <Grid container>
          <Grid item xs={6}>
            <FormGroup sx={{ marginRight: "20px" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={removeAssets}
                    onChange={() => {
                      updateRemoveAssets((prev) => !prev);
                    }}
                  />
                }
                label="Use assets in quantity calculation"
                labelPlacement="start"
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
                label="Include intermediary items"
                labelPlacement="start"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
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
            sx={{ marginRight: "20px", display: { xs: "none", sm: "block" } }}
          >
            Copy to Clipboard
          </Button>
        </CopyToClipboard>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
