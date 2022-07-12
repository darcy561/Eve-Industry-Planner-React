import { Grid, Paper, Typography } from "@mui/material";
import { useContext, useMemo } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { EveIDsContext } from "../../../Context/EveDataContext";
import { JobArrayContext, JobStatusContext } from "../../../Context/JobContext";
import itemData from "../../../RawData/searchIndex.json";

export function NewTransactions() {
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { jobStatus } = useContext(JobStatusContext);

  const filteredJobs = jobArray.filter(
    (job) => job.jobStatus === jobStatus[jobStatus.length - 1].sortOrder
  );

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  let itemOrderMatch = [];
  let transactionData = [];

  filteredJobs.forEach((job) => {
    users.forEach((user) => {
      user.apiOrders.forEach((order) => {
        if (
          order.type_id === job.itemID &&
          parentUser.linkedOrders.includes(order.order_id) &&
          !itemOrderMatch.find((item) => item.order_id === order.order_id)
        ) {
          order.CharacterHash = user.CharacterHash;

          itemOrderMatch.push(order);
        }
      });

      user.apiHistOrders.forEach((order) => {
        if (
          order.type_id === job.itemID &&
          parentUser.linkedOrders.includes(order.order_id) &&
          !itemOrderMatch.find((item) => item.order_id === order.order_id)
        ) {
          order.CharacterHash = user.CharacterHash;

          itemOrderMatch.push(order);
        }
      });
    });
    itemOrderMatch.forEach((order) => {
      const user = users.find((u) => u.CharacterHash === order.CharacterHash);

      const itemTrans = user.apiTransactions.filter(
        (trans) =>
          order.location_id === trans.location_id &&
          order.type_id === trans.type_id &&
          !parentUser.linkedTrans.includes(trans.transaction_id) &&
          !transactionData.find(
            (item) => item.transaction_id === trans.transaction_id
          ) &&
          trans.unit_price >= 0
      );

      itemTrans.forEach((trans) => {
        const transJournal = user.apiJournal.find(
          (entry) => trans.transaction_id === entry.context_id
        );
        const transTax = user.apiJournal.find(
          (entry) =>
            entry.ref_type === "transaction_tax" &&
            Date.parse(entry.date) === Date.parse(trans.date)
        );
        if (transJournal !== undefined && transTax !== undefined) {
          trans.description = transJournal.description;
          trans.amount = transJournal.unit_price;
          trans.tax = Math.abs(transTax.amount);
          trans.item_name = order.item_name;

          transactionData.push(trans);
        }
      });
    });
  });
  transactionData.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  if (transactionData.length !== 0) {
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
                    <Typography variant="body1">
                      {new Date(trans.date).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body1" align="center">
                      {itemName.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">
                      {trans.quantity} @ {trans.unit_price.toLocaleString()} ISK
                      Each
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
              variant="body1"
              align="center"
              sx={{ marginBottom: "10px" }}
            >
              There are currently no new transactions for your linked market
              orders within the ESI data.
            </Typography>
            <Typography variant="body2" align="center">
              Transaction data from the Eve ESI updates peridodically, either
              refresh the current data or check back later.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}
