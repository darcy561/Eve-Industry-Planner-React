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
    /// data = {ids: [34,35,36], matchType: "Any"|| "All"}

    const { ids: requestedIDs, matchType } = data;

    const matchingTypeIDs = new Set();

    for (const material of requestedIDs) {
      if (materialToTypeIDs[material]) {
        if (matchType === "any") {
          materialToTypeIDs[material].forEach((typeID) =>
            matchingTypeIDs.add(typeID)
          );
        } else if (matchType === "all" && matchingTypeIDs.size > 0) {
          matchingTypeIDs = new Set(
            materialToTypeIDs[material].filter((typeID) =>
              matchingTypeIDs.has(typeID)
            )
          );
        }
      }
    }

    return [...matchingTypeIDs];
  });
