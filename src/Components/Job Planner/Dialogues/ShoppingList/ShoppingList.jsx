import { useContext, useEffect, useRef, useState } from "react";
import {
  ShoppingListContext,
  SnackBarDataContext,
} from "../../../../Context/LayoutContext";
import {
  Button,
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
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { useCharAssets } from "../../../../Hooks/useCharAssets";
import {
  EveIDsContext,
  EvePricesContext,
} from "../../../../Context/EveDataContext";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { useShoppingList } from "../../../../Hooks/GeneralHooks/useShoppingList";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
} from "../../../../Context/defaultValues";
import { LoadingDataDisplay_ShoppingListDialog } from "./shoppingListLoading";
import { ListDataFrame_ShoppingListDialog } from "./shoppingListDataFrame";
import { SelectAssetLocation_ShoppingListDialog } from "./assetLocationsSelection";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";
import { AssetsFromClipboardButton_ShoppingList } from "./assetsFromClipboardButton";

export function ShoppingListDialog() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const {
    shoppingListTrigger,
    shoppingListData,
    updateShoppingListTrigger,
    updateShoppingListData,
  } = useContext(ShoppingListContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { getAssetLocationList } = useCharAssets();
  const {
    findParentUser,
    writeTextToClipboard,
    importAssetsFromClipboard_IconView,
  } = useHelperFunction();
  const {
    buildShoppingList,
    calculateVolumeTotal,
    calculateItemPrice,
    clearAssetQuantities,
    generateTextToCopy,
    importAssetsFromClipboard,
    isItemVisable,
  } = useShoppingList();
  const {
    findAssetsInLocation,
    convertAssetArrayIntoMapByTypeID,
    countAssetQuantityFromMap,
    getRequestedAssets,
  } = useAssetHelperHooks();
  const { getItemPrices } = useFirebase();
  const [childJobDisplay, updateChildJobDisplay] = useState(false);
  const [displayData, updateDisplayData] = useState([]);
  const [volumeTotal, updateVolumeTotal] = useState(0);
  const [loadingData, updateLoadingData] = useState(true);
  const [removeAssets, updateRemoveAssets] = useState(false);
  const [useCorporation, updateUseCorporation] = useState(false);
  const [assetLocations, updateAssetLocations] = useState([]);
  const parentUser = findParentUser();
  const [selectedLocation, updateSelectedLocation] = useState(
    parentUser.settings.editJob.defaultAssetLocation
  );
  const [selectedCharacter, updateSelectedCharacter] = useState(
    users.length > 1 ? "allUsers" : parentUser.CharacterHashs
  );
  const [tempEveIDs, updateTempEveIDs] = useState({});
  const shoppingListValue = useRef(0);

  useEffect(() => {
    async function createShoppingListDisplay() {
      if (!shoppingListTrigger) return;

      updateLoadingData(true);
      let newVolumeTotal = 0;
      let newDisplayData = [];
      let itemIDs = new Set();
      let newListTotal = 0;
      let shoppingList = await buildShoppingList(shoppingListData);
      shoppingList.forEach((item) => {
        itemIDs.add(item.typeID);
      });
      let itemPrices = await getItemPrices([...itemIDs], parentUser);

      const selectedAssets = await getRequestedAssets(
        selectedCharacter,
        useCorporation,
        removeAssets
      );

      const locationAssetArray = findAssetsInLocation(
        selectedAssets,
        selectedLocation
      );
      const assetsByTypeID =
        convertAssetArrayIntoMapByTypeID(locationAssetArray);

      shoppingList.forEach((listItem) => {
        listItem.assetQuantity = countAssetQuantityFromMap(
          assetsByTypeID,
          listItem.typeID
        );

        listItem.isVisible = isItemVisable(
          removeAssets,
          childJobDisplay,
          listItem
        );

        if (!listItem.isVisible) return;

        newListTotal += calculateItemPrice(listItem, itemPrices);
        newVolumeTotal += calculateVolumeTotal(listItem);

        newDisplayData.push(listItem);
      });
      shoppingListValue.current = newListTotal;
      updateDisplayData(newDisplayData);
      updateVolumeTotal(newVolumeTotal);
      updateEvePrices((prev) => ({
        ...prev,
        ...itemPrices,
      }));
      updateLoadingData(false);
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
      const { itemLocations, newEveIDs } = await getAssetLocationList();
      updateTempEveIDs((prev) => ({ ...prev, ...newEveIDs }));
      updateAssetLocations(itemLocations);
    }
    if (shoppingListTrigger) {
      assetLocationFetch();
    }
  }, [shoppingListTrigger]);

  function handleClose() {
    updateShoppingListData([]);
    updateShoppingListTrigger(false);
    updateChildJobDisplay(false);
    updateRemoveAssets(false);
    updateUseCorporation(false);
    updateDisplayData([]);
    updateSelectedLocation(parentUser.settings.editJob.defaultAssetLocation);
    updateEveIDs((prev) => ({ ...prev, ...tempEveIDs }));
    updateLoadingData(true);
  }

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
      <SelectAssetLocation_ShoppingListDialog
        removeAssets={removeAssets}
        assetLocations={assetLocations}
        tempEveIDs={tempEveIDs}
        selectedLocation={selectedLocation}
        updateSelectedLocation={updateSelectedLocation}
        selectedCharacter={selectedCharacter}
        updateSelectedCharacter={updateSelectedCharacter}
      />
      <DialogContent>
        <LoadingDataDisplay_ShoppingListDialog loadingData={loadingData} />
        <ListDataFrame_ShoppingListDialog
          loadingData={loadingData}
          displayData={displayData}
          removeAssets={removeAssets}
        />
      </DialogContent>
      <DialogActions sx={{ paddingBottom: "20px" }}>
        <Grid container>
          <Grid
            container
            sx={{
              marginTop: "10px",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <Grid item xs={4}>
              <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
                Total Volume
              </Typography>
            </Grid>
            <Grid item xs={8} align="right">
              <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
                {volumeTotal.toLocaleString()} m3
              </Typography>
            </Grid>
          </Grid>
          <Grid
            container
            sx={{
              marginTop: "20px",
              marginBottom: "20px",
              paddingLeft: "20px",
              paddingRight: "20px",
            }}
          >
            <Grid item xs={4}>
              <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
                Estimated Value
              </Typography>
            </Grid>
            <Grid item xs={8} align="right">
              <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
                {shoppingListValue.current.toLocaleString(
                  undefined,
                  TWO_DECIMAL_PLACES
                )}{" "}
                ISK
              </Typography>
            </Grid>
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={6}>
              {isLoggedIn && (
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={removeAssets}
                        onChange={() => {
                          const newDisplayData = [...displayData];
                          clearAssetQuantities(newDisplayData);
                          updateRemoveAssets((prev) => !prev);
                          updateDisplayData(newDisplayData);
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
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
                    <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                      Include Intermediary Items
                    </Typography>
                  }
                  labelPlacement="bottom"
                />
              </FormGroup>
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "20px" }}>
            <Grid container item sm={10} align="right">
              <Grid item sm={8}>
                <AssetsFromClipboardButton_ShoppingList
                  displayData={displayData}
                  updateDisplayData={updateDisplayData}
                />
              </Grid>
              <Grid item sm={4}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    display: { xs: "none", sm: "block" },
                  }}
                  onClick={async () => {
                    await writeTextToClipboard(generateTextToCopy(displayData));
                  }}
                >
                  Copy to Clipboard
                </Button>
              </Grid>
            </Grid>
            <Grid item xs={12} sm={2} align="right">
              <Button variant="text" onClick={handleClose} autoFocus>
                Close
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}
