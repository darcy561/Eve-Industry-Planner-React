const functions = require("firebase-functions");
const { GLOBAL_CONFIG } = require("../global-config-functions");
const ingrediantList = require("../rawData/ingrediantIDs.json");

const { FIREBASE_SERVER_REGION } = GLOBAL_CONFIG;

exports.findIngrediants = functions
  .region(FIREBASE_SERVER_REGION)
  .https.onCall(async (data, context) => {
    if (!context.app) {
      functions.logger.warn("Unverified function Call");
      functions.logger.warn(context);
      throw new functions.https.HttpsError(
        "Unable to verify",
        "Function must be called from a verified app"
      );
    }

    const matchingIngrediants = new Set();

    const requestedIngrediant = data;

    for (let item of ingrediantList) {
      if (item.materials.includes(requestedIngrediant)) {
        matchingIngrediants.add(item.typeID);
      }
    }

    return [...matchingIngrediants];
  });
