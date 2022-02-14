const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.updateJobSnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onUpdate((change, context) => {
    const documentNew = change.after.exists ? change.after.data() : null;
    const documentOld = change.before.exists ? change.before.data() : null;

    functions.logger.info("Invoked by Account UID " + context.params.UID);

    if (documentNew.archived == true) {
      try {
        admin
          .firestore()
          .doc(`Users/${context.params.UID}`)
          .update({
            [`jobArraySnapshot.${documentOld.jobID}`]:
              admin.firestore.FieldValue.delete(),
          });
        functions.logger.log("Item archived from snapshot");
        functions.logger.log(JSON.stringify(documentOld));
        return null;
      } catch (err) {
        functions.logger.error("Error archiving item from snapshot");
        functions.logger.error(JSON.stringify(documentOld));
        functions.logger.error(err);
      }
    } else {
      try {
        let totalComplete = 0;
        let materialIDs = [];
        let childJobs = [];
        documentNew.build.materials.forEach((material) => {
          materialIDs.push(material.typeID);
          childJobs.push(...material.childJob);
          if (material.quantityPurchased >= material.quantity) {
            totalComplete++;
          }
        });
        admin
          .firestore()
          .doc(`Users/${context.params.UID}`)
          .update({
            [`jobArraySnapshot.${documentNew.jobID}`]: {
              jobID: documentNew.jobID,
              name: documentNew.name,
              runCount: documentNew.runCount,
              jobCount: documentNew.jobCount,
              jobStatus: documentNew.jobStatus,
              jobType: documentNew.jobType,
              itemID: documentNew.itemID,
              isSnapshot: true,
              apiJobs: documentNew.apiJobs,
              itemQuantity: documentNew.build.products.totalQuantity,
              totalMaterials: documentNew.build.materials.length,
              totalComplete: totalComplete,
              linkedJobsCount: documentNew.build.costs.linkedJobs.length,
              linkedOrdersCount: documentNew.build.sale.marketOrders.length,
              linkedTransCount: documentNew.build.sale.transactions.length,
              buildVer: documentNew.buildVer,
              parentJob: documentNew.parentJob,
              childJobs: childJobs,
              materialIDs: materialIDs,
            },
          });

        functions.logger.log(`${documentNew.itemID} snapshot modified`);
        functions.logger.log(
          "New Document Data " + JSON.stringify(documentNew)
        );
        functions.logger.log(
          "Old Document Data " + JSON.stringify(documentOld)
        );
        return null;
      } catch (err) {
        functions.logging.error(
          `Error modifying ${documentNew.itemID} snapshot`
        );
        functions.logger.error(
          "New Document Data " + JSON.stringify(documentNew)
        );
        functions.logger.error(
          "Old Document Data " + JSON.stringify(documentOld)
        );
        functions.logger.error(err);
      }
    }
  });
