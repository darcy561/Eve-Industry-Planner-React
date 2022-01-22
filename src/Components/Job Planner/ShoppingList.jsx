import { useContext } from "react";
import { ShoppingListContext } from "../../Context/LayoutContext";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";

export function ShoppingListDialog() {
  const { shoppingListData, updateShoppingListData } =
    useContext(ShoppingListContext);

  const handleClose = () => {
    updateShoppingListData((prev) => ({
      open: false,
      list: [],
    }));
  };

  return (
    <Dialog
      open={shoppingListData.open}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle
        id="ShoppingListDialog"
        align="center"
        sx={{ marginBottom: "10px" }}
      >
        Shopping List
      </DialogTitle>
      <DialogContent>
        <Grid container>
          {shoppingListData.list.map((item) => {
            return (
              <Grid key={item.typeID} container item xs={12}>
                <Grid item xs={8}>
                  <Typography variant="body1">{item.name}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body1" align="right">
                    {item.quantity.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
