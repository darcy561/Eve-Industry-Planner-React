import { Grid, IconButton, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";

export function AvailableTransactionData({
  setJobModified,
  activeOrder,
  transactionData,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);

  let parentUser= users.find(
    (i) => i.ParentUser === true
  );

  class Transaction {
    constructor(trans, user) {
      this.order_id = trans.order_id;
      this.journal_ref_id = trans.journal_ref_id;
      this.unit_price = trans.unit_price;
      this.amount = trans.amount;
      this.tax = trans.tax;
      this.transaction_id = trans.transaction_id;
      this.quantity = trans.quantity;
      this.date = trans.date;
      this.location_id = trans.location_id;
      this.is_corp = !trans.is_personal;
      this.type_id = trans.type_id;
      this.description = trans.description
    }
  }

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          <Grid item xs={12}>
            <Typography variant="h5" color="primary" align="center">
              New Transactions
            </Typography>
          </Grid>
        </Grid>
        {transactionData.length !== 0 ? (
          transactionData.map((tData) => {

            return (
              <Grid
                key={tData.transaction_id}
                container
                sx={{ marginBottom: "10px" }}
              >
                <Grid item xs={4} md={1} align="center">
                  <Typography variant="body1">
                    {new Date(tData.date).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3} align="center">
                  <Typography variant="body2">{tData.description}</Typography>
                </Grid>
                <Grid item xs={2} md={1} align="right">
                  <Typography variant="body1">
                    {tData.quantity.toLocaleString()} Items
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    {tData.unit_price.toLocaleString()} ISK Each
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    {tData.amount.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item xs={4} md={2} align="right">
                  <Typography variant="body1">
                    -{tData.tax.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item md={1} align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      let newTransactionArray = [
                        ...activeJob.build.sale.transactions,
                      ];
                      if (activeJob.build.sale.marketOrders > 1) {
                        tData.order_id = activeOrder;
                      } else {
                        tData.order_id =
                          activeJob.build.sale.marketOrders[0].order_id;
                      }

                      newTransactionArray.push(
                        Object.assign({}, new Transaction(tData, parentUser))
                      );

                      let parentUserIndex = users.findIndex(
                        (i) => i.ParentUser === true
                      );
                      users[parentUserIndex].linkedTrans.push(
                        tData.transaction_id
                      );

                      updateActiveJob((prev) => ({
                        ...prev,
                        build: {
                          ...prev.build,
                          sale: {
                            ...prev.build.sale,
                            transactions: newTransactionArray,
                          },
                        },
                      }));

                      setSnackbarData((prev) => ({
                        ...prev,
                        open: true,
                        message: "Linked",
                        severity: "success",
                        autoHideDuration: 1000,
                      }));
                      setJobModified(true);
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12} align="center">
            <Typography variant="body1">
              There are currently no new transactions matching your order to
              display, assign a new order or refresh the API data.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
