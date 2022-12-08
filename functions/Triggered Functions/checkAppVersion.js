const functions = require("firebase-functions");
const checkVersion = require("../sharedFunctions/appVersion").checkAppVersion;

exports.checkAppVersion = functions
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

    let verify = checkVersion(data.appVersion);
    if (verify) {
      return true;
    } else return false;
  });
