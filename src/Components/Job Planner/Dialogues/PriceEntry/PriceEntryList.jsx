import { useContext, useMemo, useState } from "react";
import {
  PriceEntryListContext,
  SnackBarDataContext,
} from "../../../../Context/LayoutContext";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { JobArrayContext } from "../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { marketOptions, listingType } from "../../../../Context/defaultValues";
import { ItemPriceRow } from "./itemRow";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { useJobManagement } from "../../../../Hooks/useJobManagement";

export function PriceEntryDialog() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users, userDataFetch } = useContext(UsersContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { uploadJob, uploadUserJobSnapshot } = useFirebase();
  const { updateJobSnapshotFromFullJob, findJobData } = useJobManagement();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const { priceEntryListData, updatePriceEntryListData } = useContext(
    PriceEntryListContext
  );
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [importAction, changeImportAction] = useState(false);
  const [displayOrder, changeDisplayOrder] = useState(
    priceEntryListData.displayOrder === undefined ||
      priceEntryListData.displayOrder === null
      ? parentUser.settings.editJob.defaultOrders
      : priceEntryListData.displayOrder
  );
  const [displayMarket, changeDisplayMarket] = useState(
    priceEntryListData.displayMarket === undefined ||
      priceEntryListData.displayMarket === null
      ? parentUser.settings.editJob.defaultMarket
      : priceEntryListData.displayMarket
  );
  const [totalImportedCost, updateTotalImportedCost] = useState(0);
  const [totalConfirmed, updateTotalConfirmed] = useState(false);
  const [importFromClipboard, updateImportFromClipboard] = useState(false);

  const handleClose = () => {
    updateTotalImportedCost(0);
    updatePriceEntryListData((prev) => ({
      ...prev,
      open: false,
      list: [],
      displayMarket: null,
      displayOrder: null,
    }));
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    changeImportAction(true);
    let newJobArray = [...jobArray];
    let uploadIDs = [];
    let totalConfirmed = 0;
    for (let material of priceEntryListData.list) {
      if (material.confirmed) {
        totalConfirmed++;
        for (let ref of material.jobRef) {
          let [job] = await findJobData(ref, userJobSnapshot, newJobArray);
          if (job === undefined) {
            continue;
          }
          let newTotal = 0;
          job.build.materials.forEach((mat) => {
            if (mat.typeID === material.typeID && !mat.purchaseComplete) {
              mat.purchasing.push({
                id: Date.now(),
                childID: null,
                childJobImport: false,
                itemCount: mat.quantity - mat.quantityPurchased,
                itemCost: Number(material.itemPrice),
              });
              mat.quantityPurchased += mat.quantity - mat.quantityPurchased;
              mat.purchasedCost += material.itemPrice * mat.quantity;
              mat.purchaseComplete = true;
            }
            newTotal += mat.purchasedCost;
          });
          job.build.costs.totalPurchaseCost = newTotal;
          if (!uploadIDs.some((i) => i.jobID === job.jobID)) {
            uploadIDs.push(job);
          }
        }
      }
    }
    let newUserJobSnapshot = [...userJobSnapshot];
    for (let job of uploadIDs) {
      newUserJobSnapshot = updateJobSnapshotFromFullJob(
        job,
        newUserJobSnapshot
      );
      if (isLoggedIn) {
        await uploadJob(job);
      }
    }
    if (isLoggedIn) {
      uploadUserJobSnapshot(newUserJobSnapshot);
    }
    updateUserJobSnapshot(newUserJobSnapshot);
    updateJobArray(newJobArray);
    changeImportAction(false);
    updatePriceEntryListData((prev) => ({
      ...prev,
      open: false,
      list: [],
      displayMarket: null,
      displayOrder: null,
    }));
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${totalConfirmed} Item Costs Added Into ${uploadIDs.length} ${
        uploadIDs.length > 1 ? "Jobs" : "Job"
      }`,
      severity: "success",
      autoHideDuration: 3000,
    }));
  };

  return (
    <Dialog
      open={priceEntryListData.open}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle id="PriceEntryListDialog" align="center" color="primary">
        Price Entry
      </DialogTitle>
      {!parentUser.settings.layout.hideTutorials && !userDataFetch ? (
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="caption">
            Use the dropdown options to select imported costs from your chosen
            market hub or enter your own values for the items.{<br />}
            {<br />}
            Use the Import From Clipboard button to import costs copied from the
            MultiBuy window in the Eve client. This can be found in the dropdown
            menu in the top right hand corner of the window.
            {<br />}
            {<br />}
            Once you are happy with the item cost use the checkbox to confirm
            the cost. Only items with confirmed costs will be imported, these
            will satisfy all remaining materials needed.
          </Typography>
        </Grid>
      ) : null}

      <DialogActions>
        <Grid container align="center">
          <Grid item xs={6}>
            <Select
              value={displayMarket}
              variant="standard"
              size="small"
              onChange={(e) => {
                changeDisplayMarket(e.target.value);
                updatePriceEntryListData((prev) => ({
                  ...prev,
                  displayMarket: e.target.value,
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
              value={displayOrder}
              variant="standard"
              size="small"
              onChange={(e) => {
                changeDisplayOrder(e.target.value);
                updatePriceEntryListData((prev) => ({
                  ...prev,
                  displayOrder: e.target.value,
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
      </DialogActions>
      <form onSubmit={handleAdd}>
        <DialogContent>
          <Grid container>
            {priceEntryListData.list.map((item, index) => {
              return (
                <ItemPriceRow
                  key={item.typeID}
                  item={item}
                  index={index}
                  displayOrder={displayOrder}
                  displayMarket={displayMarket}
                  totalImportedCost={totalImportedCost}
                  updateTotalImportedCost={updateTotalImportedCost}
                  importFromClipboard={importFromClipboard}
                  updateImportFromClipboard={updateImportFromClipboard}
                />
              );
            })}
          </Grid>
        </DialogContent>
        <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
          <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
            Confirmed Cost Total
          </Typography>
          <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
            {totalImportedCost.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Grid>
        <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
          {!totalConfirmed ? (
            <Button
              onClick={() => {
                let newList = [...priceEntryListData.list];
                let newTotal = totalImportedCost;
                newList.forEach((item) => {
                  if (item.itemPrice > 0) {
                    if (!item.confirmed) {
                      newTotal += item.itemPrice * item.quantity;
                    }
                    item.confirmed = true;
                  }
                });
                updateTotalConfirmed((prev) => !prev);
                updateTotalImportedCost(newTotal);
                updatePriceEntryListData((prev) => ({
                  ...prev,
                  list: newList,
                }));
              }}
            >
              Confirm All
            </Button>
          ) : (
            <Button
              onClick={() => {
                let newList = [...priceEntryListData.list];
                newList.forEach((item) => {
                  item.confirmed = false;
                });
                updateTotalConfirmed((prev) => !prev);
                updateTotalImportedCost(0);
                updatePriceEntryListData((prev) => ({
                  ...prev,
                  list: newList,
                }));
              }}
            >
              Unconfirm All
            </Button>
          )}
        </Grid>

        <DialogActions sx={{ padding: "20px" }}>
          {!importAction ? (
            <>
              <Button
                onClick={async () => {
                  let newList = [...priceEntryListData.list];
                  let newTotal = totalImportedCost;
                  let importedText = await navigator.clipboard.readText();
                  let importCount = 0;
                  let matches = [
                    ...importedText.matchAll(
                      /^(.*)\t([0-9,]*)\t([0-9,.]*)\t([0-9,.]*)$/gm
                    ),
                  ];
                  if (matches.length > 0) {
                    for (let importMatch of matches) {
                      for (let listItem of newList) {
                        if (
                          listItem.name === importMatch[1] &&
                          !listItem.confirmed
                        ) {
                          let number = parseFloat(
                            importMatch[3].replace(/,/g, "")
                          );

                          newTotal += number * listItem.quantity;
                          listItem.confirmed = true;
                          listItem.itemPrice = number;
                          importCount++;
                        }
                      }
                    }
                    updateTotalImportedCost(newTotal);
                    updatePriceEntryListData((prev) => ({
                      ...prev,
                      list: newList,
                    }));
                    updateImportFromClipboard(true);
                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${importCount} Prices Added`,
                      severity: "success",
                      autoHideDuration: 3000,
                    }));
                  } else {
                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `No Matching Items Found`,
                      severity: "error",
                      autoHideDuration: 3000,
                    }));
                  }
                }}
              >
                Import From MultiBuy
              </Button>
              <Button
                variant="contained"
                sx={{ marginRight: "20px" }}
                type="submit"
              >
                Add Prices
              </Button>
            </>
          ) : (
            <CircularProgress size="small" color="primary" />
          )}

          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
