const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.newJobSnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onCreate((snapshot, context) => {
    const newDoc = snapshot.data();
    functions.logger.info("Invoked by Account UID " + context.params.UID);
    try {
      let totalComplete = 0;
      let materialIDs = [];
      let childJobs = [];

      newDoc.build.materials.forEach((material) => {
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
          [`jobArraySnapshot.${newDoc.jobID}`]: {
            jobID: newDoc.jobID,
            name: newDoc.name,
            runCount: newDoc.runCount,
            jobCount: newDoc.jobCount,
            jobStatus: newDoc.jobStatus,
            jobType: newDoc.jobType,
            itemID: newDoc.itemID,
            isSnapshot: true,
            apiJobs: newDoc.apiJobs,
            itemQuantity: newDoc.build.products.totalQuantity,
            totalMaterials: newDoc.build.materials.length,
            totalComplete: totalComplete,
            linkedJobsCount: newDoc.build.costs.linkedJobs.length,
            linkedOrdersCount: newDoc.build.sale.marketOrders.length,
            linkedTransCount: newDoc.build.sale.transactions.length,
            buildVer: newDoc.buildVer,
            parentJob: newDoc.parentJob,
            childJobs: childJobs,
            materialIDs: materialIDs,
          },
        });
      functions.logger.log(`${newDoc.itemID} added to snapshot`);
      functions.logger.log(JSON.stringify(newDoc));
      return null;
    } catch (err) {
      functions.logger.error(
        `Error adding new item ${newDoc.itemID} to snapshot`
      );
      functions.logger.error(JSON.stringify(newDoc));
      functions.logger.error(err);
    }
  });
