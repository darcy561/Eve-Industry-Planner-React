import { useContext, useEffect, useMemo, useState } from "react";
import {
  PriceEntryListContext,
  SnackBarDataContext,
} from "../../../../Context/LayoutContext";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { UsersContext } from "../../../../Context/AuthContext";
import { marketOptions, listingType } from "../../../../Context/defaultValues";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import { ItemPriceRow } from "../src/Components/Job Planner/Dialogues/PriceEntry/itemRow";

export function PriceEntryDialog() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const { priceEntryListData, updatePriceEntryListData } = useContext(
    PriceEntryListContext
  );
  const { setSnackbarData } = useContext(SnackBarDataContext);
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
  const [childJobDisplay, updateChildJobDisplay] = useState(false);
  const { evePrices } = useContext(EvePricesContext);

  const handleClose = () => {
    updatePriceEntryListData((prev) => ({
      ...prev,
      open: false,
      list: [],
      displayMarket: null,
      displayOrder: null,
    }));
  };

  return (
    <Dialog
      open={priceEntryListData.open}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle
        id="PriceEntryListDialog"
        align="center"
        sx={{ marginBottom: "10px" }}
        color="primary"
      >
        Price Entry
      </DialogTitle>
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
      <DialogContent>
        <form>
          <Grid container>
            {priceEntryListData.list.map((item, index) => {
              return (
                <ItemPriceRow
                  key={item.typeID}
                  item={item}
                  index={index}
                  displayOrder={displayOrder}
                  displayMarket={displayMarket}
                />
              );
            })}
          </Grid>
        </form>
        <Grid container sx={{ marginTop: "20px" }}>
          <Grid item xs={4}>
            <Typography variant="body1">Total Volume</Typography>
          </Grid>
          <Grid item xs={8} align="right">
            <Typography vatiant="body1">x</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <FormGroup sx={{ marginRight: "20px" }}>
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

        <Button
          variant="contained"
          sx={{ marginRight: "20px", display: { xs: "none", sm: "block" } }}
        >
          Copy to Clipboard
        </Button>
        <Button onClick={handleClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
