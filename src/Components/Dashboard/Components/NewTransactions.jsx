import { Grid, Paper, Typography } from "@mui/material";
import { useEffect } from "react";
import { useContext, useMemo } from "react";
import {
  UserJobSnapshot,
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import {
  JobStatusContext,
  LinkedIDsContext,
} from "../../../Context/JobContext";
import itemData from "../../../RawData/searchIndex.json";

export function NewTransactions() {
  const { users } = useContext(UsersContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { jobStatus } = useContext(JobStatusContext);
  const { linkedOrderIDs, linkedTransIDs } = useContext(LinkedIDsContext);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  let itemOrderMatch = [];
  let transactionData = [];

  const filteredJobs = userJobSnapshot.filter(
    (job) => job.jobStatus === jobStatus[jobStatus.length - 1].sortOrder
  );

  filteredJobs.forEach((job) => {
    users.forEach((user) => {
      JSON.parse(
        sessionStorage.getItem(`esiOrders_${user.CharacterHash}`)
      ).forEach((order) => {
        if (
          order.type_id === job.itemID &&
          !linkedOrderIDs.includes(order.order_id) &&
          !parentUser.linkedOrders.has(order.order_id) &&
          !itemOrderMatch.find((item) => item.order_id === order.order_id)
        ) {
          order.CharacterHash = user.CharacterHash;

          itemOrderMatch.push(order);
        }
      });

      JSON.parse(
        sessionStorage.getItem(`esiHistOrders_${user.CharacterHash}`)
      ).forEach((order) => {
        if (
          order.type_id === job.itemID &&
          !linkedOrderIDs.includes(order.order_id) &&
          !parentUser.linkedOrders.has(order.order_id) &&
          !itemOrderMatch.find((item) => item.order_id === order.order_id)
        ) {
          order.CharacterHash = user.CharacterHash;

          itemOrderMatch.push(order);
        }
      });
    });

    itemOrderMatch.forEach((order) => {
      const user = users.find((u) => u.CharacterHash === order.CharacterHash);

      const itemTrans = JSON.parse(
        sessionStorage.getItem(`esiTransactions_${user.CharacterHash}`)
      ).filter(
        (trans) =>
          order.location_id === trans.location_id &&
          order.type_id === trans.type_id &&
          !linkedTransIDs.includes(trans.transaction_id) &&
          !parentUser.linkedTrans.has(trans.transaction_id) &&
          !transactionData.find(
            (item) => item.transaction_id === trans.transaction_id
          ) &&
          trans.unit_price >= 0
      );

      itemTrans.forEach((trans) => {
        const transJournal = JSON.parse(
          sessionStorage.getItem(`esiJournal_${user.CharacterHash}`)
        ).find((entry) => trans.transaction_id === entry.context_id);
        const transTax = JSON.parse(
          sessionStorage.getItem(`esiJournal_${user.CharacterHash}`)
        ).find(
          (entry) =>
            entry.ref_type === "transaction_tax" &&
            Date.parse(entry.date) === Date.parse(trans.date)
        );
        if (transJournal !== undefined && transTax !== undefined) {
          trans.description = transJournal.description;
          trans.tax = Math.abs(transTax.amount);

          transactionData.push(trans);
        }
      });
    });
  });
  transactionData.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

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
                      {trans.quantity} @ {trans.unit_price.toLocaleString()}
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
}
