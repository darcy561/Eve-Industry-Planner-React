import { useContext, useMemo, useState } from "react";
import { Container, Grid } from "@mui/material";
import {
  ActiveJobContext,
  LinkedIDsContext,
} from "../../../../Context/JobContext";
import { UsersContext } from "../../../../Context/AuthContext";
import { SalesStats } from "./Page 5 Components/salesStats";
import { AvailableTransactionData } from "./Page 5 Components/availableTransactions";
import { LinkedTransactions } from "./Page 5 Components/linkedTransactions";
import { TutorialStep5 } from "./Page 5 Components/tutorialStep5";
import { MarketOrderTabs } from "./Page 5 Components/marketOrderTabs";
import { MarketCostsPanel } from "./Page 5 Components/marketCostsPanel";
import { PersonalESIDataContext } from "../../../../Context/EveDataContext";

export function EditPage5({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const [showAvailableOrders, updateShowAvailableOrders] = useState(false);
  const [activeOrder, updateActiveOrder] = useState([]);
  const { users } = useContext(UsersContext);
  const { linkedOrderIDs, linkedTransIDs } = useContext(LinkedIDsContext);
  const { esiOrders, esiHistOrders, esiTransactions, esiJournal } = useContext(
    PersonalESIDataContext
  );
  let itemOrderMatch = [];

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  class Transaction {
    constructor(trans, desc, journal, tax) {
      this.order_id = null;
      this.journal_ref_id = trans.journal_ref_id;
      this.unit_price = trans.unit_price;
      this.amount = journal.amount;
      this.tax = Math.abs(tax.amount);
      this.transaction_id = trans.transaction_id;
      this.quantity = trans.quantity;
      this.date = trans.date;
      this.location_id = trans.location_id;
      this.is_corp = !trans.is_personal;
      this.type_id = trans.type_id;
      this.description = desc;
    }
  }
  esiOrders.forEach((entry) => {
    entry.data.forEach((order) => {
      if (
        order.type_id === activeJob.itemID &&
        !activeJob.apiOrders.has(order.order_id) &&
        !linkedOrderIDs.includes(order.order_id) &&
        !parentUser.linkedOrders.has(order.order_id) &&
        !itemOrderMatch.some((i) => i.order_id === order.order_id)
      ) {
        itemOrderMatch.push(order);
      }
    });
  });
  esiHistOrders.forEach((entry) => {
    entry.data.forEach((order) => {
      if (
        order.type_id === activeJob.itemID &&
        !activeJob.apiOrders.has(order.order_id) &&
        !linkedOrderIDs.includes(order.order_id) &&
        !parentUser.linkedOrders.has(order.order_id) &&
        !itemOrderMatch.some((i) => i.order_id === order.order_id)
      ) {
        order.CharacterHash = entry.user;
        itemOrderMatch.push(order);
      }
    });
  });

  let transactionData = [];

  activeJob.build.sale.marketOrders.forEach((order) => {
    let userTrans = esiTransactions.find(
      (i) => i.user === order.CharacterHash
    ).data;
    let userJournal = esiJournal.find(
      (i) => i.user === order.CharacterHash
    ).data;

    const itemTrans = userTrans.filter(
      (trans) =>
        order.location_id === trans.location_id &&
        order.type_id === trans.type_id &&
        !trans.is_buy &&
        !activeJob.apiTransactions.has(trans.transaction_id) &&
        !linkedTransIDs.includes(trans.transaction_id) &&
        !parentUser.linkedTrans.has(trans.transaction_id) &&
        !transactionData.some((i) => i.transaction_id === trans.transaction_id)
    );

    itemTrans.forEach((trans) => {
      const transJournal = userJournal.find(
        (entry) => trans.transaction_id === entry.context_id
      );
      if (transJournal === undefined) {
        return;
      }
      const transTax = userJournal.find(
        (entry) =>
          entry.ref_type === "transaction_tax" &&
          Date.parse(entry.date) === Date.parse(trans.date)
      );
      if (transTax === undefined) {
        return;
      }
      let descriptionTrim = transJournal.description
        .replace("Market: ", "")
        .split(" bought");

      transactionData.push(
        Object.assign(
          {},
          new Transaction(trans, descriptionTrim[0], transJournal, transTax)
        )
      );
    });
  });

  return (
    <Container disableGutters maxWidth="false">
      <Grid container spacing={2}>
        <TutorialStep5 />

        <Grid item xs={12}>
          <MarketCostsPanel />
        </Grid>
        <Grid item xs={12} md={8}>
          <MarketOrderTabs
            setJobModified={setJobModified}
            itemOrderMatch={itemOrderMatch}
            updateShowAvailableOrders={updateShowAvailableOrders}
            activeOrder={activeOrder}
            updateActiveOrder={updateActiveOrder}
          />
        </Grid>

        <Grid item xs={12} md={4}>
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
