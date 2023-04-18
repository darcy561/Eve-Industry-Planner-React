import { useContext, useMemo } from "react";
import { ActiveJobContext, LinkedIDsContext } from "../../Context/JobContext";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../Context/EveDataContext";
import { UsersContext } from "../../Context/AuthContext";

export function useMarketOrderFunctions() {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { linkedOrderIDs, linkedTransIDs } = useContext(LinkedIDsContext);
  const { esiOrders, esiHistOrders, esiJournal, esiTransactions } = useContext(
    PersonalESIDataContext
  );
  const {
    corpEsiOrders,
    corpEsiHistOrders,
    corpEsiJournal,
    corpEsiTransactions,
  } = useContext(CorpEsiDataContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  class Transaction {
    constructor(trans, desc, journal, tax, CharacterHash) {
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
      this.CharacterHash = CharacterHash;
    }
  }

  function filterMarketOrders(orders, existingOrders) {
    orders.forEach((entry) => {
      entry.data.forEach((order) => {
        if (
          order.type_id === activeJob.itemID &&
          !activeJob.apiOrders.has(order.order_id) &&
          !linkedOrderIDs.includes(order.order_id) &&
          !parentUser.linkedOrders.has(order.order_id) &&
          !existingOrders.some((i) => i.order_id === order.order_id)
        ) {
          if (entry.user) {
            order.CharacterHash = entry.user;
          }
          existingOrders.push(order);
        }
      });
    });
  }

  function filterTransactions(order, transactions, existingTransactions) {
    transactions.forEach((trans) => {
      if (
        order.location_id === trans.location_id &&
        order.type_id === trans.type_id &&
        !activeJob.apiTransactions.has(trans.transaction_id) &&
        !linkedTransIDs.includes(trans.transaction_id) &&
        !parentUser.linkedTrans.has(trans.transaction_id) &&
        !existingTransactions.some(
          (i) => i.transaction_id === trans.transaction_id
        )
      ) {
        existingTransactions.push(trans);
      }
    });
  }

  const findJournalEntry = (transaction, charJournal, corpJournal) => {
    if (transaction.is_personal) {
      return charJournal.find(
        (entry) => transaction.transaction_id === entry.context_id
      );
    } else {
      for (let { data } of corpJournal) {
        let t = data.find((i) => i.context_id === transaction.transaction_id);
        if (t) return t;
      }
    }
  };

  const findTransactionTax = (transaction, charJournal, corpJournal) => {
    if (transaction.is_personal) {
      return charJournal.find(
        (entry) =>
          entry.ref_type === "transaction_tax" &&
          Date.parse(entry.date) === Date.parse(transaction.date)
      );
    } else {
      for (let { data } of corpJournal) {
        let t = data.find(
          (entry) =>
            entry.ref_type === "transaction_tax" &&
            Date.parse(entry.date) === Date.parse(transaction.date)
        );
        if (t) return t;
      }
    }
  };

  const findMarketOrdersForItem = () => {
    let matchingMarketOrders = [];
    filterMarketOrders(esiOrders, matchingMarketOrders);
    filterMarketOrders(esiHistOrders, matchingMarketOrders);
    filterMarketOrders(corpEsiOrders, matchingMarketOrders);
    filterMarketOrders(corpEsiHistOrders, matchingMarketOrders);
    return matchingMarketOrders;
  };

  const findTransactionsForMarketOrders = (order) => {
    let characterTransactions =
      esiTransactions.find((i) => i.user === order.CharacterHash)?.data || [];
    let corporationTransactions =
      corpEsiTransactions.find((i) => i.user === order.CharacterHash)?.data ||
      [];
    let matchingTransactions = [];
    filterTransactions(order, characterTransactions, matchingTransactions);
    for (let { data } of corporationTransactions) {
      filterTransactions(order, data, matchingTransactions);
    }

    return matchingTransactions;
  };

  const buildTransactionData = () => {
    const transactionData = [];
    activeJob.build.sale.marketOrders.forEach((order) => {
      let characterJournal = esiJournal.find(
        (i) => i.user === order.CharacterHash
      )?.data;
      let corporationJournal = corpEsiJournal.find(
        (i) => i.user === order.CharacterHash
      )?.data;

      const itemTransactions = findTransactionsForMarketOrders(order);

      itemTransactions.forEach((itemTrans) => {
        const transJournal = findJournalEntry(
          itemTrans,
          characterJournal,
          corporationJournal
        );
        const transTax = findTransactionTax(
          itemTrans,
          characterJournal,
          corporationJournal
        );
        if (transJournal && transTax) {
          const descriptionTrim = transJournal.description
            .replace("Market: ", "")
            .split(" bought");
          transactionData.push({
            ...new Transaction(
              itemTrans,
              descriptionTrim[0],
              transJournal,
              transTax,
              order.CharacterHash
            ),
          });
        }
      });
    });
    return transactionData;
  };

  return {
    findMarketOrdersForItem,
    findTransactionsForMarketOrders,
    buildTransactionData,
  };
}
