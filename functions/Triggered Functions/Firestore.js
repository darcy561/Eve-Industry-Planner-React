const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.updateJobArraySnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onWrite((change, context) => {
    const documentNew = change.after.exists ? change.after.data() : null;
    const documentOld = change.before.exists ? change.before.data() : null;
    
    functions.logger.info("Invoked by Account UID "+ context.params.UID);    

    if (documentNew == null) {
      try {
        admin
          .firestore()
          .doc(`Users/${context.params.UID}`)
          .update({
            [`jobArraySnapshot.${documentOld.jobID}`]:
              admin.firestore.FieldValue.delete(),
          });
        functions.logger.log("Item deleted from snapshot");
        functions.logger.log(JSON.stringify(documentOld));
        return null;
      } catch (err) {
        functions.logger.error("Error deleting item from snapshot")
        functions.logger.error(JSON.stringify(documentOld));
        functions.logger.error(err);
      }
    }

    else if (documentNew.archived == true) {
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
        functions.logger.error("Error archiving item from snapshot")
        functions.logger.error(JSON.stringify(documentOld));
        functions.logger.error(err);
      }
    }

    else if (documentOld == null) {
      try {
        let totalComplete = 0;
        documentNew.build.materials.forEach((material) => {
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
            },
          });
        functions.logger.log(`${documentNew.itemID} added to snapshot`);
        functions.logger.log(JSON.stringify(documentNew));
        return null;
      } catch (err) {
        functions.logger.error(`Error adding new item ${documentNew.itemID} to snapshot`)
        functions.logger.error(JSON.stringify(documentNew));
        functions.logger.error(err)
      }
    }

    else if (
      documentNew.runCount != documentOld.runCount ||
      documentNew.jobCount != documentOld.jobCount ||
      documentNew.jobStatus != documentOld.jobStatus ||
      documentNew.buildVer != documentOld.buildVer ||
      documentNew.parentJob != documentOld.parentJob ||
      documentNew.build.products.totalQuantity != documentOld.build.products.totalQuantity ||
      documentNew.build.costs.linkedJobs.length != documentOld.build.costs.linkedJobs.length ||
      documentNew.build.sale.marketOrders.length != documentOld.build.sale.marketOrders.length ||
      documentNew.build.sale.transactions.length != documentOld.build.sale.transactions.length
    ) {
      try {
        let totalComplete = 0;
        documentNew.build.materials.forEach((material) => {
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
            },
          });
        
        functions.logger.log(`${documentNew.itemID} snapshot modified`);
        functions.logger.log("New Document Data " + JSON.stringify(documentNew));
        functions.logger.log("Old Document Data " + JSON.stringify(documentOld));
        return null;
      } catch (err) {
        functions.logging.error(`Error modifying ${documentNew.itemID} snapshot`)
        functions.logger.error("New Document Data " + JSON.stringify(documentNew));
        functions.logger.error("Old Document Data " + JSON.stringify(documentOld));
        functions.logger.error(err)
      }
    }

  else if (
    documentNew.archived === false &&
    documentOld.archived === true
  ) {
      try {
        let totalComplete = 0;
        documentOld.build.materials.forEach((material) => {
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
            parentJob: documentNew.parentJob
          },
        });
      functions.logger.log(`${documentNew.itemID} removed from archive`);
      functions.logger.log("New Document Data " + JSON.stringify(documentNew));
      functions.logger.log("Old Document Data " + JSON.stringify(documentOld));
      return null;
    } catch (err) {
      functions.logging.error(`Error removeing item ${documentNew.itemID} from archive`)
      functions.logger.error("New Document Data " + JSON.stringify(documentNew));
      functions.logger.error("Old Document Data " + JSON.stringify(documentOld));
      functions.logger.error(err)
    }
    }
    return null
});
