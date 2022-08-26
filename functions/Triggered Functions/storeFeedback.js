const functions = require("firebase-functions");
const admin = require("firebase-admin");
const bucket = admin.storage().bucket();

exports.submitUserFeedback = functions
  .region("europe-west1")
  .https.onCall((data, context) => {
    if (context.app === undefined) {
      functions.logger.warn("Unverified function Call");
      functions.logger.warn(context);
      throw new functions.https.HttpsError(
        "Unable to verify",
        "Function must be called from a verified app"
      );
      }
      try {
        bucket.file().save()
          
      } catch (err) {
          
      }
  });
