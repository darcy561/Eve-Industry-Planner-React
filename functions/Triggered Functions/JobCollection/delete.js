const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.deleteJobSnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onDelete(async (snapshot, context) => {
    try {
      const userDocRef = admin.firestore().doc(`Users/${context.params.UID}`);
      const jobDoc = snapshot.data();
      await admin.firestore().runTransaction(async (t) => {
        const mainUserDoc = await t.get(userDocRef);

        let newLinkedJobs = mainUserDoc
          .data()
          .linkedJobs.filter((ID) => !jobDoc.apiJobs.includes(ID));

        let newLinkedOrders = mainUserDoc
          .data()
          .linkedOrders.filter(
            (orderID) =>
              !jobDoc.build.sale.marketOrders.some(
                (order) => order.order_id === orderID
              )
          );

        let newLinkedTrans = mainUserDoc
          .data()
          .linkedTrans.filter(
            (transID) =>
              !jobDoc.build.sale.transactions.some(
                (trans) => trans.transaction_id === transID
              )
          );

        return t.update(mainUserDoc.ref, {
          ["jobArraySnapshot." + context.params.JobID]:
            admin.firestore.FieldValue.delete(),
          linkedJobs: newLinkedJobs,
          linkedOrders: newLinkedOrders,
          linkedTrans: newLinkedTrans,
        });
      });
      functions.logger.info(`Invoked by Account UID ${context.params.UID}`);
      functions.logger.log(`Job ${context.params.JobID} deleted from snapshot`);
    } catch (err) {
      functions.logger.error("Error deleting item from snapshot");
      functions.logger.error(JSON.stringify(snapshot.data()));
      functions.logger.error(err);
    }
  });
