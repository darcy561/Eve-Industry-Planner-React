import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useImportFitFromClipboard } from "../../../../../Hooks/GroupHooks/useImportFitFromClipboard";

export function ImportItemFitDialogue({
  importFitDialogueTrigger,
  updateImportFitDialogueTrigger,
}) {
  const [clipboardPermissionDisabled, updateClipboardPermissionDisabled] =
      useState(false);
    const [importedItemList, updateImportedItemList] = useState([])
    const { importFromClipboard } = useImportFitFromClipboard();
    

  const handleClose = () => {
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
            updateImportedItemList(items)
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
      <DialogTitle>Import Fit</DialogTitle>
          <DialogContent>
              {clipboardPermissionDisabled ?
              <Typography> No Access To Clipboard</Typography>
            :
                  <Grid container>
                      
            </Grid>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
