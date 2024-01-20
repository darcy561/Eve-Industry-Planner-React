import { useState } from "react";
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
import { DateTimePicker } from "@mui/x-date-pickers";
import uuid from "react-uuid";

export function AddCustomTransactionDialog({
  activeJob,
  updateActiveJob,
  newTransactionTrigger,
  updateNewTransactionTrigger,
  setJobModified,
}) {
  const [transactionData, setTransactionData] = useState({
    order_id: null,
    journal_ref_id: null,
    unit_price: 0,
    amount: 0,
    transaction_id: uuid(),
    quantity: 0,
    date: Date.now(),
    location_id: null,
    is_corp: false,
    type_id: activeJob.itemID,
    tax: 0,
    description: null,
  });

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
                variant="outlined"
                renderInput={(props) => <TextField {...props} />}
                value={Date.now()}
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                  "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                    {
                      display: "none",
                    },
                }}
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
                variant="standard"
                helperText="Description"
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                  "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                    {
                      display: "none",
                    },
                }}
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
                variant="standard"
                helperText="Item Cost"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">ISK</InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                  "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                    {
                      display: "none",
                    },
                }}
                onBlur={(v) => {
                  setTransactionData((prev) => ({
                    ...prev,
                    unit_price: Number(v.target.value.replace(/[^0-9. ]/g, "")),
                    amount:
                      Number(v.target.value.replace(/[^0-9. ]/g, "")) *
                      transactionData.quantity,
                  }));
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                variant="standard"
                helperText="Quantity"
                type="number"
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                  "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                    {
                      display: "none",
                    },
                }}
                onBlur={(v) => {
                  if (v.target.value >= 0) {
                    setTransactionData((prev) => ({
                      ...prev,
                      quantity: Number(v.target.value.replace(/[^0-9. ]/g, "")),
                      amount:
                        Number(v.target.value.replace(/[^0-9. ]/g, "")) *
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
                variant="standard"
                helperText="Tax Or Fees Paid"
                type="number"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">ISK</InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiFormHelperText-root": {
                    color: (theme) => theme.palette.secondary.main,
                  },
                  "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                    {
                      display: "none",
                    },
                }}
                onBlur={(v) => {
                  if (v.target.value >= 0) {
                    setTransactionData((prev) => ({
                      ...prev,
                      tax: Number(v.target.value.replace(/[^0-9. ]/g, "")),
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
