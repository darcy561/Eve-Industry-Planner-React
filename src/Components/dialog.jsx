import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import React, { useContext } from "react";
import { DialogDataContext } from "../Context/LayoutContext";

export function DialogBox() {
  const { dialogData, updateDialogData } = useContext(DialogDataContext);

  const handleClose = () => {
    updateDialogData((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <>
      <Dialog
        aria-aria-labelledby={dialogData.id}
        open={dialogData.open}
        onClose={handleClose}
      >
        <DialogTitle id={dialogData.id}>{dialogData.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={dialogData.id}>
            {dialogData.body}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            {dialogData.buttonText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
