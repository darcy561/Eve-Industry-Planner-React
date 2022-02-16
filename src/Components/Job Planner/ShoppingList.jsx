import { useContext, useState } from "react";
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
  FormControlLabel,
  FormGroup,
  Grid,
  Switch,
  Typography,
} from "@mui/material";
import CopyToClipboard from "react-copy-to-clipboard";

export function ShoppingListDialog() {
  const { shoppingListData, updateShoppingListData } =
    useContext(ShoppingListContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [childJobDisplay, updateChildJobDisplay] = useState(false);

  let copyText = "";
  let volumeTotal = 0;
  let displayData = [];
  if (shoppingListData.open) {
    shoppingListData.list.forEach((i) => {
      if (childJobDisplay) {
        copyText = copyText.concat(`${i.name} ${i.quantity}\n`);
        volumeTotal += i.volume * i.quantity;
        displayData = shoppingListData.list;
      } else {
        if (!i.hasChild) {
          copyText = copyText.concat(`${i.name} ${i.quantity}\n`);
          volumeTotal += i.volume * i.quantity;
          displayData = shoppingListData.list.filter((i) => !i.hasChild);
        }
      }
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
        color="primary"
      >
        Shopping List
      </DialogTitle>
      <DialogContent>
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
                    src={`https://image.eveonline.com/Type/${item.typeID}_32.png`}
                    alt=""
                  />
                </Grid>
                <Grid item xs={8} sm={7}>
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
        <Grid container sx={{ marginTop: "20px" }}>
          <Grid item xs={4}>
            <Typography variant="body1">Total Volume</Typography>
          </Grid>
          <Grid item xs={8} align="right">
            <Typography vatiant="body1">
              {volumeTotal.toLocaleString()} m3
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <FormGroup sx={{marginRight:"20px"}}>
          <FormControlLabel
            control={
              <Switch
                checked={childJobDisplay}
                onChange={() => {
                  updateChildJobDisplay((prev) => !prev);
                }}
              />
            }
            label="Include intermediary items"
            labelPlacement="start"
          />
        </FormGroup>
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
          <Button variant="contained" sx={{ marginRight: "20px" }}>
            Copy to Clipboard
          </Button>
        </CopyToClipboard>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
