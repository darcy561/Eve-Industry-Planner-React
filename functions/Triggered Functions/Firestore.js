const admin = require("firebase-admin");
const functions = require("firebase-functions");

exports.updateJobArraySnapshot = functions.firestore
  .document("Users/{UID}/Jobs/{JobID}")
  .onWrite((change, context) => {
    const documentNew = change.after.exists ? change.after.data() : null;
    const documentOld = change.before.exists ? change.before.data() : null;
    
    functions.logger.log("Old Document Data " + documentOld);
    functions.logger.log("New Document Data " + documentNew);
    functions.logger.log("Account UID "+ context.params.UID);

    if (documentNew == null) {
      admin
        .firestore()
        .doc(`Users/${context.params.UID}`)
        .update({
          [`jobArraySnapshot.${documentOld.jobID}`]:
            admin.firestore.FieldValue.delete(),
        });
      return null;
    }

    if (documentOld == null) {
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
          },
        });
      return null;
    }

    if (
      documentNew.runCount != documentOld.runCount ||
      documentNew.jobCount != documentOld.jobCount ||
      documentNew.jobStatus != documentOld.jobStatus
    ) {
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
            isSnapshot: true
          },
        });
      return null;
    }
  });
