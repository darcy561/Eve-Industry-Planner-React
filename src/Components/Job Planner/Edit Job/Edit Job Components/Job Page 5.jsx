import { useContext, useState } from "react";
import { Container, Grid } from "@mui/material";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { SalesStats } from "./Page 5 Components/salesStats";
import { AvailableMarketOrders } from "./Page 5 Components/availableMarketOrders";
import { LinkedMarketOrders } from "./Page 5 Components/linkedMarketOrders";
import { AvailableTransactionData } from "./Page 5 Components/availableTransactions";
import { LinkedTransactions } from "./Page 5 Components/linkedTransactions";

export function EditPage5({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const [showAvailableOrders, updateShowAvailableOrders] = useState(false);
  const [activeOrder, updateActiveOrder] = useState(null);
  const { users } = useContext(UsersContext);
  const { mainUser } = useContext(MainUserContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);

  let itemOrderMatch = [];

  if (isLoggedIn) {
    users.forEach((user) => {
      user.apiOrders.forEach((order) => {
        if (
          order.type_id === activeJob.itemID &&
          !activeJob.build.sale.marketOrders.includes(order.order_id)
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
  }
  let transactionData = [];

  if (isLoggedIn) {
    activeJob.build.sale.marketOrders.forEach((order) => {
      const user = users.find((u) => u.CharacterID === order.user_id);

      const itemTrans = user.apiTransactions.filter(
        (trans) =>
          order.location_id === trans.location_id &&
          order.type_id === trans.type_id &&
          !trans.is_buy &&
          Date.parse(trans.date) > Date.parse(order.timeStamps[0]) &&
          !mainUser.linkedTrans.includes(trans.transaction_id)
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
        trans.description = transJournal.description;
        trans.amount = transJournal.amount;
        trans.tax = Math.abs(transTax.amount);
        trans.order_id = null;

        transactionData.push(trans);
      });
    });
  }

  return (
    <Container disableGutters maxWidth="false">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {activeJob.build.sale.marketOrders.length == 0 ||
          showAvailableOrders ? (
            <AvailableMarketOrders
              setJobModified={setJobModified}
              itemOrderMatch={itemOrderMatch}
              updateShowAvailableOrders={updateShowAvailableOrders}
            />
          ) : (
            <LinkedMarketOrders
              setJobModified={setJobModified}
              updateActiveOrder={updateActiveOrder}
              updateShowAvailableOrders={updateShowAvailableOrders}
            />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <SalesStats />
        </Grid>
        <Grid item xs={12}>
          <AvailableTransactionData
            setJobModified={setJobModified}
            itemOrderMatch={itemOrderMatch}
            activeOrder={activeOrder}
            transactionData={transactionData}
          />
        </Grid>
        <Grid item xs={12}>
          <LinkedTransactions
            setJobModified={setJobModified}
            activeOrder={activeOrder}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
