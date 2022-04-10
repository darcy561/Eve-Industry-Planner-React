import { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  TextField,
} from "@mui/material";
import { DateTimePicker } from "@mui/lab";
import { ActiveJobContext } from "../../../../../Context/JobContext";
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

export function AddTransactionDialog({
  newTransactionTrigger,
  updateNewTransactionTrigger,
  setJobModified,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [transactionData, setTransactionData] = useState({
    order_id: null,
    journal_ref_id: null,
    unit_price: 0,
    amount: 0,
    transaction_id: Date.now(),
    quantity: 0,
    date: Date.now(),
    location_id: null,
    is_corp: false,
    type_id: activeJob.itemID,
    tax: 0,
    description: null,
  });
  const classes = useStyles();

  const handleClose = () => {
    updateNewTransactionTrigger(false);
  };

  return (
    <Dialog
      open={newTransactionTrigger}
      onClose={handleClose}
      sx={{ padding: "20px" }}
    >
      <DialogTitle align="center">New Transaction</DialogTitle>
      <DialogContent>
        <Grid container>
          <Grid container item xs={12} sx={{ paddingTop: "10px" }}>
            <Grid item xs={6}>
              <DateTimePicker
                className={classes.TextField}
                variant="outlined"
                renderInput={(props) => <TextField {...props} />}
                value={Date.now()}
                onChange={(v) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    date: v.toJSON(),
                  }));
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.TextField}
                variant="standard"
                helperText="Description"
                onBlur={(v) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    description: v.target.value.replace(/[^a-zA-Z0-9 ]/g, ""),
                  }));
                }}
              />
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ paddingTop: "20px" }}>
            <Grid item xs={6}>
              <TextField
                className={classes.TextField}
                variant="standard"
                helperText="Item Cost"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">ISK</InputAdornment>
                  ),
                }}
                onBlur={(v) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    unit_price: Number(v.target.value.replace(/[^0-9 ]/g, "")),
                    amount:
                      Number(v.target.value.replace(/[^0-9 ]/g, "")) *
                      transactionData.quantity,
                  }));
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                className={classes.TextField}
                variant="standard"
                helperText="Quantity"
                type="number"
                onBlur={(v) => {
                  if (v.target.value >= 0) {
                    setTransactionData((prev) => ({
                      ...prev,
                      quantity: Number(v.target.value.replace(/[^0-9 ]/g, "")),
                      amount:
                        Number(v.target.value.replace(/[^0-9 ]/g, "")) *
                        transactionData.unit_price,
                    }));
                  } else {
                    setTransactionData((prev) => ({
                      ...prev,
                      quantity: 0,
                      amount: 0 * transactionData.unit_price,
                    }));
                  }
                }}
              />
            </Grid>
          </Grid>
          <Grid container item xs={12} sx={{ paddingTop: "20px" }}>
            <Grid item xs={6}>
              <TextField
                className={classes.TextField}
                variant="standard"
                helperText="Tax Or Fees Paid"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">ISK</InputAdornment>
                  ),
                }}
                onBlur={(v) => {
                  if (v.target.value >= 0) {
                    setTransactionData((prev) => ({
                      ...prev,
                      tax: Number(v.target.value.replace(/[^0-9 ]/g, "")),
                    }));
                  } else {
                    setTransactionData((prev) => ({
                      ...prev,
                      tax: 0,
                    }));
                  }
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ padding: "20px" }}>
        <Button size="large" onClick={handleClose} sx={{ marginRight: "20px" }}>
          Close
        </Button>
        <Button
          size="large"
          variant="contained"
          onClick={() => {
            let newTransactions = [...activeJob.build.sale.transactions];
            newTransactions.push(transactionData);
            updateActiveJob((prev) => ({
              ...prev,
              build: {
                ...prev.build,
                sale: {
                  ...prev.build.sale,
                  transactions: newTransactions,
                },
              },
            }));
            setJobModified(true);
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
