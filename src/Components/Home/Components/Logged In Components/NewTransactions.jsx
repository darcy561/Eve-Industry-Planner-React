import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { MainUserContext, UsersContext } from "../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { JobArrayContext } from "../../../../Context/JobContext";

export function NewTransactions() {
  const { mainUser } = useContext(MainUserContext);
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  const { eveIDs } = useContext(EveIDsContext);

  const filteredJobs = jobArray.filter((job) => job.jobStatus === 4);

  let itemOrderMatch = [];
  let transactionData = [];

  filteredJobs.forEach((job) => {
    users.forEach((user) => {
      user.apiOrders.forEach((order) => {
        if (
          order.type_id === job.itemID &&
          !job.build.sale.marketOrders.includes(order.order_id)
        ) {
          eveIDs.find((item) => {
            if (item.id === order.location_id) {
              order.user_id = user.CharacterID;
              order.location_name = item.name;
            }
            if (item.id === order.region_id) {
              order.region_name = item.name;
            }
          });
          itemOrderMatch.push(order);
        }
      });
    });

    //   job.forEach((order) => {
    //     const user = users.find((u) => u.CharacterID === order.user_id);

    //     const itemTrans = user.apiTransactions.filter(
    //       (trans) =>
    //         order.location_id === trans.location_id &&
    //         order.type_id === trans.type_id &&
    //         !trans.is_buy &&
    //         Date.parse(trans.date) > Date.parse(order.timeStamps[0]) &&
    //         !mainUser.linkedTrans.includes(trans.transaction_id)
    //     );

    //     itemTrans.forEach((trans) => {
    //       const transJournal = user.apiJournal.find(
    //         (entry) => trans.transaction_id === entry.context_id
    //       );

    //       const transTax = user.apiJournal.find(
    //         (entry) =>
    //           entry.ref_type === "transaction_tax" &&
    //           Date.parse(entry.date) === Date.parse(trans.date)
    //       );
    //       trans.description = transJournal.description;
    //       trans.amount = transJournal.amount;
    //       trans.tax = Math.abs(transTax.amount);
    //       trans.order_id = null;

    //       transactionData.push(trans);
    //     });
    //   });
  });
  console.log(filteredJobs);
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
        <Grid item xs={12}>
          <Typography variant="h5" color="primary" align="center">
            New Job Transactions
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
