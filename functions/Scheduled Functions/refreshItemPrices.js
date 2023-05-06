const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketQuery = require("../sharedFunctions/priceData").ESIMarketQuery;
const axios = require("axios");

const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";
const MARKET_PRICES_REF = "market-prices";
const TIME_LIMIT = 4 * 60 * 60 * 1000; // 4 hours
const MAX_ITEMS = 150;

exports.scheduledFunction = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 30 minutes")
  .timeZone("Etc/GMT")
  .onRun(async (context) => {
    try {
      const pricingSnapshot = await admin
        .database()
        .ref(MARKET_PRICES_REF)
        .orderByChild("lastUpdated")
        .endAt(Date.now() - TIME_LIMIT)
        .limitToLast(MAX_ITEMS)
        .once("value");

      let pricingData = pricingSnapshot.val();

      if (!pricingData) {
        return null;
      }

      const server = await axios.get(EVE_SERVER_STATUS_API);

      if (server.status !== 200) {
        functions.logger.warn(
          "Eve Servers Offline - Unable To Refresh Item Prices"
        );
        return null;
      }

      let successRefreshCount = 0;
      let failedRefreshCount = 0;
      const refreshedIDs = [];
      const failedIDs = [];

      for (const [typeID] of Object.entries(pricingData)) {
        const response = await ESIMarketQuery(typeID, false);
        if (response === "fail") {
          failedRefreshCount++;
          failedIDs.push(typeID);
        } else {
          successRefreshCount++;
          refreshedIDs.push(typeID);
          pricingData[typeID] = response;
        }
      }
      if (refreshedIDs.length > 0) {
        await admin.database().ref(MARKET_PRICES_REF).update(pricingData);
      }

      functions.logger.log(
        `Number of TypeID's Refreshed ${successRefreshCount}. TypeID's Refreshed ${JSON.stringify(
          refreshedIDs
        )}`
      );
      if (failedRefreshCount > 0) {
        functions.logger.log(
          `Number of TypeID's Failed ${failedRefreshCount}. TypeID's Failed ${JSON.stringify(
            failedIDs
          )}`
        );
      }
      return null;
    } catch (err) {
      functions.logger.error(`An error occured: ${err}`);
      return null;
    }
  });
