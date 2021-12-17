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

    if (documentOld == null) {
      try {
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
              apiJobs: documentNew.apiJobs
            },
          });
        functions.logger.log("New item added to snapshot");
        functions.logger.log(JSON.stringify(documentNew));
        return null;
      } catch (err) {
        functions.logger.error("Error adding new item to snapshot")
        functions.logger.error(JSON.stringify(documentNew));
        functions.logger.error(err)
      }
    }

    if (
      documentNew.runCount != documentOld.runCount ||
      documentNew.jobCount != documentOld.jobCount ||
      documentNew.jobStatus != documentOld.jobStatus
    ) {
      try {
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
              apiJobs: documentNew.apiJobs
            },
          });
        functions.logger.log("Item snapshot modified");
        functions.logger.log("New Document Data " + JSON.stringify(documentNew));
        functions.logger.log("Old Document Data " + JSON.stringify(documentOld));
        return null;
      } catch (err) {
        functions.logging.error("Error modifying item snapshot")
        functions.logger.error("New Document Data " + JSON.stringify(documentNew));
        functions.logger.error("Old Document Data " + JSON.stringify(documentOld));
        functions.logger.error(err)
      }
    }
  });
