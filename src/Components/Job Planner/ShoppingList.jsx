import { useContext } from "react";
import {
  ShoppingListContext,
  SnackBarDataContext,
} from "../../Context/LayoutContext";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import CopyToClipboard from "react-copy-to-clipboard";

export function ShoppingListDialog() {
  const { shoppingListData, updateShoppingListData } =
    useContext(ShoppingListContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  let copyText = "";
  let volumeTotal = 0

  if (shoppingListData.open) {
    shoppingListData.list.forEach((i) => {
      copyText = copyText.concat(`${i.name} ${i.quantity}\n`);
      volumeTotal += (i.volume*i.quantity)
    });
  }
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
        <Grid container sx={{marginTop: "20px"}}>
          <Grid item xs={4}>
            <Typography variant="body1">Total Volume</Typography>
          </Grid>
          <Grid item xs={8} align="right">
            <Typography vatiant="body1">{volumeTotal.toLocaleString()} m3</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
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
          <Button>Copy to Clipboard</Button>
        </CopyToClipboard>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
