import { useContext, useEffect, useMemo, useState } from "react";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import CopyToClipboard from "react-copy-to-clipboard";
import { useJobManagement } from "../../../../Hooks/useJobManagement";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { useCharAssets } from "../../../../Hooks/useCharAssets";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Select: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
  },
}));

export function ShoppingListDialog({
  shoppingListTrigger,
  updateShoppingListTrigger,
  shoppingListData,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { users } = useContext(UsersContext);
  const { getAssetLocationList } = useCharAssets();
  const { buildShoppingList } = useJobManagement();
  const { findLocationAssets } = useCharAssets();
  const [childJobDisplay, updateChildJobDisplay] = useState(false);
  const [displayData, updateDisplayData] = useState([]);
  const [volumeTotal, updateVolumeTotal] = useState(0);
  const [copyText, updateCopyText] = useState("");
  const [loadingData, updateLoadingData] = useState(true);
  const [removeAssets, updateRemoveAssets] = useState(false);
  const [assetLocations, updateAssetLocations] = useState([]);
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);
  const [selectedLocation, updateSelectedLocation] = useState(
    parentUser.settings.editJob.defaultAssetLocation
  );
  const [selectedCharacter, updateSelectedCharacter] = useState(
    users.length > 1 ? "all" : parentUser.CharacterHash
  );
  const [newEveIDs, updateNewEveIDs] = useState([]);
  const classes = useStyles();

  useEffect(() => {
    async function createShoppingListDisplay() {
      if (shoppingListTrigger) {
        updateLoadingData(true);
        let newVolumeTotal = 0;
        let newCopyText = "";
        let newDisplayData = [];
        let shoppingList = await buildShoppingList(shoppingListData);
        let [fullAssetList, locationAssets] = await findLocationAssets(
          selectedLocation
        );

        function calcVolume(listItem, assetQuantity) {
          if (removeAssets) {
            return listItem.volume * (listItem.quantity - assetQuantity);
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

        function findCharAssets(item) {
          if (selectedCharacter !== "all") {
            return fullAssetList.find(
              (m) => m.item_id === item && m.CharacterHash === selectedCharacter
            );
          }

          return fullAssetList.find((m) => m.item_id === item);
        }

        shoppingList.forEach((listItem) => {
          let assetType = locationAssets.find(
            (i) => i.type_id === listItem.typeID
          );
          let assetQuantity = 0;
          if (assetType !== undefined) {
            assetType.itemIDs.forEach((item) => {
              let asset = findCharAssets(item);
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
  }, [
    shoppingListTrigger,
    childJobDisplay,
    removeAssets,
    selectedLocation,
    selectedCharacter,
  ]);
  useEffect(() => {
    async function assetLocationFetch() {
      let [newAssetList, tempIDs] = await getAssetLocationList();
      updateNewEveIDs(tempIDs);
      updateAssetLocations(newAssetList);
    }
    if (shoppingListTrigger) {
      assetLocationFetch();
    }
  }, [shoppingListTrigger]);

  const handleClose = () => {
    updateShoppingListTrigger(false);
    updateChildJobDisplay(false);
    updateRemoveAssets(false);
    updateDisplayData([]);
    updateSelectedLocation(parentUser.settings.editJob.defaultAssetLocation);
    updateEveIDs(newEveIDs);
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
      {removeAssets && (
        <DialogActions>
          <Grid container>
            <Grid item xs={6}>
              <FormControl className={classes.Select} fullWidth={true}>
                <Select
                  value={selectedLocation}
                  size="small"
                  onChange={(e) => {
                    updateSelectedLocation(e.target.value);
                  }}
                >
                  {assetLocations.map((entry) => {
                    let locationNameData = newEveIDs.find(
                      (i) => entry === i.id
                    );

                    if (
                      locationNameData === undefined ||
                      locationNameData.name === "No Access To Location"
                    ) {
                      return null;
                    }
                    return (
                      <MenuItem key={entry} value={entry}>
                        {locationNameData.name}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Asset Location
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl className={classes.Select} fullWidth={true}>
                <Select
                  value={selectedCharacter}
                  size="small"
                  onChange={(e) => {
                    updateSelectedCharacter(e.target.value);
                  }}
                >
                  {users.length > 1 && (
                    <MenuItem key={"all"} value={"all"}>
                      All
                    </MenuItem>
                  )}
                  {users.map((user) => {
                    return (
                      <MenuItem
                        key={user.CharacterHash}
                        value={user.CharacterHash}
                      >
                        {user.CharacterName}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Character Selection
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </DialogActions>
      )}
      <DialogContent>
        {!loadingData ? (
          displayData.length > 0 ? (
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
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body1" } }}
                  >
                    Total Volume
                  </Typography>
                </Grid>
                <Grid item xs={8} align="right">
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body1" } }}
                  >
                    {volumeTotal.toLocaleString()} m3
                  </Typography>
                </Grid>
              </Grid>
            </>
          ) : (
            <Grid container>
              <Grid item xs={12}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  No Items Required
                </Typography>
              </Grid>
            </Grid>
          )
        ) : (
          <Grid container>
            <Grid item xs={12} align="center">
              <CircularProgress color="primary" />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Grid container>
          <Grid container item xs={12}>
            <Grid item xs={6}>
              {isLoggedIn && (
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
                        Use Character Assets
                      </Typography>
                    }
                    labelPlacement="bottom"
                  />
                </FormGroup>
              )}
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
                      Include Intermediary Items
                    </Typography>
                  }
                  labelPlacement="bottom"
                />
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
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
