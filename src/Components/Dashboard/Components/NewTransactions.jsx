import { CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { useContext, useMemo, useCallback } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import { PersonalESIDataContext } from "../../../Context/EveDataContext";
import {
  JobStatusContext,
  LinkedIDsContext,
} from "../../../Context/JobContext";
import itemData from "../../../RawData/searchIndex.json";

export function NewTransactions() {
  const { users, userDataFetch } = useContext(UsersContext);
  const { userJobSnapshot, userJobSnapshotDataFetch } = useContext(
    UserJobSnapshotContext
  );
  const { jobStatus } = useContext(JobStatusContext);
  const { linkedOrderIDs, linkedTransIDs } = useContext(LinkedIDsContext);
  const { esiOrders, esiHistOrders, esiTransactions, esiJournal } = useContext(
    PersonalESIDataContext
  );

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  let itemOrderMatch = [];
  const filteredJobs = useMemo(
    () =>
      userJobSnapshot.filter(
        (job) => job.jobStatus === jobStatus[jobStatus.length - 1].sortOrder
      ),
    [userJobSnapshot]
  );

  let findTransactionData = useCallback(() => {
    let returnTransactions = [];
    if (
      esiOrders === undefined ||
      esiTransactions === undefined ||
      esiJournal === undefined ||
      esiOrders === undefined ||
      esiHistOrders === undefined
    ) {
      return returnTransactions;
    }
    filteredJobs.forEach((job) => {
      esiOrders.forEach((entry) => {
        entry.data.forEach((order) => {
          if (
            order.type_id === job.itemID &&
            linkedOrderIDs.includes(order.order_id) &&
            !parentUser.linkedOrders.has(order.order_id) &&
            !itemOrderMatch.find((item) => item.order_id === order.order_id)
          ) {
            order.CharacterHash = entry.user;
            itemOrderMatch.push(order);
          }
        });
      });
      esiHistOrders.forEach((entry) => {
        entry.data.forEach((order) => {
          if (
            order.type_id === job.itemID &&
            linkedOrderIDs.includes(order.order_id) &&
            !parentUser.linkedOrders.has(order.order_id) &&
            !itemOrderMatch.find((item) => item.order_id === order.order_id)
          ) {
            order.CharacterHash = entry.user;

            itemOrderMatch.push(order);
          }
        });
      });
      itemOrderMatch.forEach((order) => {
        const userTransactions = esiTransactions.find(
          (u) => u.user === order.CharacterHash
        );
        if (userTransactions === undefined) return;

        const transactions = userTransactions.data;

        const itemTrans = transactions.filter(
          (trans) =>
            order.location_id === trans.location_id &&
            order.type_id === trans.type_id &&
            !linkedTransIDs.includes(trans.transaction_id) &&
            !parentUser.linkedTrans.has(trans.transaction_id) &&
            !returnTransactions.find(
              (item) => item.transaction_id === trans.transaction_id
            ) &&
            trans.unit_price >= 0
        );
        itemTrans.forEach((trans) => {
          const userJournal = esiJournal.find(
            (u) => u.user === order.CharacterHash
          );
          if (userJournal === undefined) return;
          const journal = userJournal.data;
          const transJournal = journal.find(
            (entry) => trans.transaction_id === entry.context_id
          );
          const transTax = journal.find(
            (entry) =>
              entry.ref_type === "transaction_tax" &&
              Date.parse(entry.date) === Date.parse(trans.date)
          );
          if (transJournal !== undefined && transTax !== undefined) {
            trans.description = transJournal.description;
            trans.tax = Math.abs(transTax.amount);

            returnTransactions.push(trans);
          }
        });
      });
    });
    returnTransactions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    return returnTransactions;
  }, [filteredJobs, esiJournal, esiHistOrders, esiOrders, esiTransactions]);

  let transactionData = findTransactionData();

  if (!userDataFetch && !userJobSnapshotDataFetch) {
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
            <Grid container item xs={12}>
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
