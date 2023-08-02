const functions = require("firebase-functions");
const {
  ESIItemAdjustedPriceQuery,
} = require("../sharedFunctions/fetchAdjustedPrices");
const axios = require("axios");
const { GLOBAL_CONFIG } = require("../global-config-functions");

const { FIREBASE_SERVER_REGION, FIREBASE_SERVER_TIMEZONE } = GLOBAL_CONFIG;

const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";

exports.scheduledFunction = functions
  .region(FIREBASE_SERVER_REGION)
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("0 13 * * *")
  .timeZone(FIREBASE_SERVER_TIMEZONE)
  .onRun(async (context) => {
    try {
      const server = await axios.get(EVE_SERVER_STATUS_API);

      if (server.status !== 200) {
        functions.logger.warn(
          "Eve Servers Offline - Unable To Refresh Item Prices"
        );
        return null;
      }

      const result = await ESIItemAdjustedPriceQuery();

      if (!result) {
        functions.logger.error("Error Updating Adjusted Prices");
        return null;
      }

      functions.logger.log("Adjusted Prices Updated");

      return null;
    } catch (err) {
      functions.logger.error(`An error occured: ${err}`);
      return null;
    }
  });
