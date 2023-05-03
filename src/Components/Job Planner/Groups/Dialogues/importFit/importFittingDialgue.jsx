import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useImportFitFromClipboard } from "../../../../../Hooks/GroupHooks/useImportFitFromClipboard";
import { ImportFittingItemRow } from "./importFittingItemRow";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));

export function ImportItemFitDialogue({
  importFitDialogueTrigger,
  updateImportFitDialogueTrigger,
}) {
  const [clipboardPermissionDisabled, updateClipboardPermissionDisabled] =
    useState(false);
  const [importedItemList, updateImportedItemList] = useState([]);
  const [fitQuantityMultiplier, updateFitQuantityMultiplier] = useState(1);
  const { finalBuildRequests, importFromClipboard } =
    useImportFitFromClipboard();
  const classes = useStyles();

  const handleClose = () => {
    updateClipboardPermissionDisabled(false);
    updateImportedItemList([]);
    updateFitQuantityMultiplier(1);
    updateImportFitDialogueTrigger((prev) => !prev);
  };

  useEffect(() => {
    async function checkClipboardPermission() {
      if (importFitDialogueTrigger) {
        const queryResult = await navigator.permissions.query({
          name: "clipboard-read",
        });
        if (queryResult.state === "denied") {
          updateClipboardPermissionDisabled(true);
          return;
        }
        try {
          const items = await importFromClipboard();
          updateImportedItemList(items);
        } catch (err) {
          if (err.message == "Read permission denied.") {
            updateClipboardPermissionDisabled(true);
          }
        }
      }
    }
    checkClipboardPermission();
  }, [importFitDialogueTrigger]);
  return (
    <Dialog
      open={importFitDialogueTrigger}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle color="primary" align="center">
        Import Fit
      </DialogTitle>
      <DialogContent>
        {clipboardPermissionDisabled ? (
          <Typography> No Access To Clipboard</Typography>
        ) : (
          <Grid container>
            {importedItemList.map((item, index) => {
              return (
                <ImportFittingItemRow
                  key={item.itemID}
                  updateImportedItemList={updateImportedItemList}
                  item={item}
                  index={index}
                />
              );
            })}
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <Grid container>
          <Grid item xs={3}>
            <TextField
              fullWidth
              className={classes.TextField}
              size="size"
              variant="standard"
              helperText="Fit Quantity"
              type="number"
              value={fitQuantityMultiplier}
              InputProps={{ inputProps: { step: "1", min: 1 } }}
              onChange={(e) => {
                const newItemArray = importedItemList.map((entry) => {
                  entry.itemCalculatedQty =
                    entry.itemBaseQty * Math.round(e.target.value);
                  return entry;
                });
                updateImportedItemList(newItemArray);
                updateFitQuantityMultiplier(Math.round(e.target.value));
              }}
            />
          </Grid>
          <Grid item xs={3} />
          <Grid item xs={4} align="center">
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                await finalBuildRequests(importedItemList);
                handleClose();
              }}
            >
              Import Items
            </Button>
          </Grid>
          <Grid item xs={2} align="center">
            <Button onClick={handleClose}>Close</Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}
