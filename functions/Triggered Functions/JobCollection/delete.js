const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.deleteJobSnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onDelete((snapshot, context) => {
    const deletedDoc = snapshot.data();
    functions.logger.info("Invoked by Account UID " + context.params.UID);
    try {
      admin
        .firestore()
        .doc(`Users/${context.params.UID}`)
        .update({
          [`jobArraySnapshot.${deletedDoc.jobID}`]:
            admin.firestore.FieldValue.delete(),
        });
      functions.logger.log("Item deleted from snapshot");
      functions.logger.log(JSON.stringify(deletedDoc));
      return null;
    } catch (err) {
      functions.logger.error("Error deleting item from snapshot");
      functions.logger.error(JSON.stringify(deletedDoc));
      functions.logger.error(err);
    }
  });
