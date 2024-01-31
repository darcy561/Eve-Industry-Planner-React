import { CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { useContext, useMemo, useCallback } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../../Context/EveDataContext";
import {
  JobStatusContext,
  LinkedIDsContext,
} from "../../../Context/JobContext";
import { UserLoginUIContext } from "../../../Context/LayoutContext";
import itemData from "../../../RawData/searchIndex.json";
import { useMarketOrderFunctions } from "../../../Hooks/GeneralHooks/useMarketOrderFunctions";

export function NewTransactions() {
  const { users } = useContext(UsersContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { linkedOrderIDs, linkedTransIDs } = useContext(LinkedIDsContext);
  const { esiOrders, esiHistOrders, esiTransactions, esiJournal } = useContext(
    PersonalESIDataContext
  );
  const {
    corpEsiOrders,
    corpEsiHistOrders,
    corpEsiJournal,
    corpEsiTransactions,
  } = useContext(CorpEsiDataContext);
  const { userDataFetch, userJobSnapshotDataFetch } =
    useContext(UserLoginUIContext);
  const {
    findTransactionsForMarketOrders,
    findJournalEntry,
    findTransactionTax,
  } = useMarketOrderFunctions();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  let findTransactionData = useCallback(() => {
    let returnTransactions = [];
    const includedOrderIDs = new Set();
    if (
      !esiOrders ||
      !esiHistOrders ||
      !esiTransactions ||
      !esiJournal ||
      !corpEsiOrders ||
      !corpEsiHistOrders ||
      !corpEsiJournal ||
      !corpEsiTransactions
    )
      return returnTransactions;

    const filteredJobs = userJobSnapshot.filter(
      (job) => job.jobStatus === jobStatus[jobStatus.length - 1].sortOrder
    );

    const combinedESIData = [
      ...esiOrders.flatMap((entry) => entry?.data ?? []),
      ...esiHistOrders.flatMap((entry) => entry?.data ?? []),
      ...corpEsiOrders.flatMap((entry) => entry?.data ?? []),
      ...corpEsiHistOrders.flatMap((entry) => entry?.data ?? []),
    ];

    const itemOrderMatch = combinedESIData.filter((order) => {
      const isMatch =
        filteredJobs.some((job) => job.itemID === order.type_id) &&
        linkedOrderIDs.includes(order.order_id) &&
        !parentUser.linkedOrders.has(order.order_id) &&
        !includedOrderIDs.has(order.order_id);
      if (isMatch) {
        includedOrderIDs.add(order.order_id);
      }
      return isMatch;
    });
    const matchedTransactions = new Set()
    itemOrderMatch.forEach((order) => {
      const itemTrans = findTransactionsForMarketOrders(order, matchedTransactions);

      itemTrans.forEach((trans) => {
        const transJournal = findJournalEntry(trans);
        const transTax = findTransactionTax(trans);

        if (!transJournal || !transTax) return;
        matchedTransactions.add(trans.transaction_id)
        returnTransactions.push({
          ...trans,
          description: transJournal.description,
          tax: Math.abs(transTax.amount),
        });
      });
    });
    returnTransactions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    return returnTransactions;
  }, [userJobSnapshot, esiJournal, esiHistOrders, esiOrders, esiTransactions]);

  let transactionData = findTransactionData();

  if (userDataFetch && userJobSnapshotDataFetch) {
    if (transactionData.length > 0) {
      return (
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            marginLeft: {
              xs: "5px",
              md: "10px",
            },
            marginRight: {
              xs: "5px",
              md: "10px",
            },
          }}
          square
        >
          <Grid container>
            <Grid item xs={12} sx={{ marginBottom: "20px" }}>
              <Typography variant="h5" color="primary" align="center">
                New Job Transactions
              </Typography>
            </Grid>
            <Grid container item xs={12} sx={{overflowY:"auto", maxHeight:{xs:"320px", md:"750px"}}}>
              {transactionData.map((trans) => {
                let itemName = itemData.find((i) => i.itemID === trans.type_id);
                if (itemName === undefined) return null;
                return (
                  <Grid
                    key={trans.transaction_id}
                    container
                    item
                    sx={{ marginBottom: "5px" }}
                  >
                    <Grid item xs={3}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {new Date(trans.date).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        align="center"
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {itemName.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography
                        align="right"
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {trans.quantity.toLocaleString()} @{" "}
                        {trans.unit_price.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Paper>
      );
    } else {
      return (
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            marginLeft: {
              xs: "5px",
              md: "10px",
            },
            marginRight: {
              xs: "5px",
              md: "10px",
            },
          }}
          square={true}
        >
          <Grid container>
            <Grid item xs={12} sx={{ marginBottom: "20px" }}>
              <Typography variant="h5" color="primary" align="center">
                New Job Transactions
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{
                  marginBottom: "10px",
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                There are currently no new transactions for your linked market
                orders within the ESI data.
              </Typography>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                Transaction data from the Eve ESI updates peridodically, either
                refresh the current data or check back later.
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      );
    }
  } else {
    return (
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginLeft: {
            xs: "5px",
            md: "10px",
          },
          marginRight: {
            xs: "5px",
            md: "0px",
          },
        }}
        square
      >
        <Grid container>
          <Grid item xs={12} align="center">
            <CircularProgress color="primary" />
          </Grid>
          <Grid item xs={12} align="center">
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Updating User Data
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
