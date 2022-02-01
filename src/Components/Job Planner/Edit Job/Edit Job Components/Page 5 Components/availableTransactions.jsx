import { Grid, IconButton, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { IsLoggedInContext, UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";

export function AvailableTransactionData({
  setJobModified,
  activeOrder,
  transactionData,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const analytics = getAnalytics();

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
                item
                xs={12}
                key={tData.transaction_id}
                container
                sx={{ marginBottom: "10px" }}
              >
                <Grid item xs={6} md={1} align="center" sx={{marginBottom:{xs:"10px", sm:"0px"}}}>
                  <Typography variant="body2">
                    {new Date(tData.date).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2} align="center">
                  <Typography variant="body2">{tData.description}</Typography>
                </Grid>
                <Grid item xs={12} md={2} align="center" sx={{marginBottom:{xs:"10px", sm:"0px"}}}>
                  <Typography variant="body2">
                    {tData.quantity.toLocaleString()}{""}@{" "}
                    {tData.unit_price.toLocaleString()} ISK Each
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2} align="center">
                  <Typography variant="body2">
                    {tData.amount.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2} align="center">
                  <Typography variant="body2">
                    -{tData.tax.toLocaleString()} ISK
                  </Typography>
                </Grid>
                <Grid item xs={12} md={1} align="center">
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
                        tData
                      );
                      newTransactionArray.sort((a, b) => {
                        return new Date(b.date) - new Date(a.date);
                      });

                      let parentUserIndex = users.findIndex(
                        (i) => i.ParentUser === true
                      );

                      let newUsers = [...users];
                      newUsers[parentUserIndex].linkedTrans.push(
                        tData.transaction_id
                      );
                      updateUsers(newUsers);

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
                      
                      logEvent(analytics, "linkedTransaction", {
                        UID: users[parentUserIndex].accountID,
                        isLoggedIn: isLoggedIn
                      });
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
