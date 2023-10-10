import { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
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
    <Dialog open={dialogData.open} onClose={handleClose}>
      <DialogTitle id={dialogData.id}>{dialogData.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={dialogData.id} color="secondary">
          {dialogData.body}
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
