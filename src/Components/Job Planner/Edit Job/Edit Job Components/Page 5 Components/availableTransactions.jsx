import {
  Avatar,
  Button,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  LinkedIDsContext,
} from "../../../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useMarketOrderFunctions } from "../../../../../Hooks/GeneralHooks/useMarketOrderFunctions";

export function AvailableTransactionData({ setJobModified, activeOrder }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { linkedTransIDs, updateLinkedTransIDs } = useContext(LinkedIDsContext);
  const { buildTransactionData } = useMarketOrderFunctions();
  const analytics = getAnalytics();

  const transactionData = buildTransactionData();

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
        <Grid
          container
          item
          xs={12}
          sx={{
            overflowY: "auto",
            maxHeight: {
              xs: "350px",
              sm: "260px",
              md: "240px",
              lg: "240px",
              xl: "480px",
            },
          }}
        >
          {transactionData.length !== 0 ? (
            transactionData.map((tData) => {
              const charData = users.find(
                (i) => i.CharacterHash === tData.CharacterHash
              );

              return (
                <Grid
                  item
                  xs={12}
                  key={tData.transaction_id}
                  container
                  sx={{ marginBottom: "10px" }}
                >
                  <Grid item xs={1}>
                    <Avatar
                      src={
                        charData !== undefined
                          ? tData.is_corp
                            ? `https://images.evetech.net/corporations/${charData.corporation_id}/logo`
                            : `https://images.evetech.net/characters/${charData.CharacterID}/portrait`
                          : ""
                      }
                      variant="circular"
                      sx={{ height: "32px", width: "32px" }}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={11}
                    md={1}
                    align="center"
                    sx={{ marginBottom: { xs: "10px", sm: "0px" } }}
                  >
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {new Date(tData.date).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2} align="center">
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {tData.description}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={2}
                    align="center"
                    sx={{ marginBottom: { xs: "10px", sm: "0px" } }}
                  >
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {tData.quantity.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      @{" "}
                      {tData.unit_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} align="center">
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {tData.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                    </Typography>
                  </Grid>
                  <Grid item sm={6} md={2} align="center" sx={{display:{xs:"none", sm: "block"}}}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      -
                      {tData.tax.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
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
                        let newApiTransactions = new Set(
                          activeJob.apiTransactions
                        );
                        let newLinkedTransIDs = new Set(linkedTransIDs);

                        if (activeJob.build.sale.marketOrders > 1) {
                          tData.order_id = activeOrder;
                        } else {
                          tData.order_id =
                            activeJob.build.sale.marketOrders[0].order_id;
                        }

                        newTransactionArray.push(tData);
                        newTransactionArray.sort((a, b) => {
                          return new Date(b.date) - new Date(a.date);
                        });

                        let parentUserIndex = users.findIndex(
                          (i) => i.ParentUser === true
                        );

                        newLinkedTransIDs.add(tData.transaction_id);

                        newApiTransactions.add(tData.transaction_id);

                        updateLinkedTransIDs([...newLinkedTransIDs]);
                        updateActiveJob((prev) => ({
                          ...prev,
                          apiTransactions: newApiTransactions,
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
                          isLoggedIn: isLoggedIn,
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
              <Typography sx={{ typography: { xs: "caption", md: "body1" } }}>
                There are currently no new transactions matching your order to
                display, assign a new order or refresh the API data.
              </Typography>
            </Grid>
          )}
        </Grid>
        {transactionData.length > 1 && (
          <Grid item xs={12} align="right" sx={{ marginTop: "10px" }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                let newTransactionArray = [
                  ...activeJob.build.sale.transactions,
                ];
                let newApiTransactions = new Set(activeJob.apiTransactions);
                let newLinkedTransIDs = new Set(linkedTransIDs);
                let parentUserIndex = users.findIndex(
                  (i) => i.ParentUser === true
                );
                for (let trans of transactionData) {
                  if (activeJob.build.sale.marketOrders > 1) {
                    trans.order_id = activeOrder;
                  } else {
                    trans.order_id =
                      activeJob.build.sale.marketOrders[0].order_id;
                  }
                  newTransactionArray.push(trans);
                  newApiTransactions.add(trans.transaction_id);
                  newLinkedTransIDs.add(trans.transaction_id);
                }
                newTransactionArray.sort((a, b) => {
                  return new Date(b.date) - new Date(a.date);
                });
                updateLinkedTransIDs([...newLinkedTransIDs]);
                updateActiveJob((prev) => ({
                  ...prev,
                  apiTransactions: newApiTransactions,
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
                  message: "All Transactions Linked",
                  severity: "success",
                  autoHideDuration: 1000,
                }));
                setJobModified(true);
                logEvent(analytics, "massLinkedTransactions", {
                  UID: users[parentUserIndex].accountID,
                  isLoggedIn: isLoggedIn,
                });
              }}
            >
              Link All
            </Button>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
