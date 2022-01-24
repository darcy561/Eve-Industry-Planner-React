import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
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
      <Dialog
        open={dialogData.open}
        onClose={handleClose}
      >
        <DialogTitle id={dialogData.id}>{dialogData.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={dialogData.id}>
            <Typography variant="body1"color="secondary">{dialogData.body}</Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            {dialogData.buttonText}
          </Button>
        </DialogActions>
      </Dialog>
  );
}
