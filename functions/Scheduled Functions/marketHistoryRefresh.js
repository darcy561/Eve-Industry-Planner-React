const { GLOBAL_CONFIG } = require("../global-config-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketHistoryQuery = require();

const {
  FIREBASE_SERVER_REGION,
  FIREBASE_SERVER_TIMEZONE,
  DEFAUL_ITEM_HISTROY_REFRESH_PERIOD,
  DEFAULT_ITEM_MARKET_HISTORY_REFRESH_QUANTITY,
} = GLOBAL_CONFIG;
const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";
const MARKET_PRICES_REF = "live-data/market-history";
const TIME_LIMIT = DEFAUL_ITEM_HISTROY_REFRESH_PERIOD * 60 * 60 * 1000;

exports.scheduledfunction = functions
  .region(FIREBASE_SERVER_REGION)
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 2 hours")
  .timeZone(FIREBASE_SERVER_TIMEZONE)
  .onRun(async (context) => {
    try {
      const pricingSnapshot = await admin
        .database()
        .ref(MARKET_PRICES_REF)
        .orderByChild("lastUpdated")
        .endAt(Date.now() - TIME_LIMIT)
        .limitToLast(DEFAULT_ITEM_MARKET_HISTORY_REFRESH_QUANTITY)
        .once("value");

      let pricingData = pricingSnapshot.val();

      if (!pricingData) return null;
      if (pricingData.length === 0) {
        functions.logger.log("No typeID's found to refresh");
        return null;
      }

      const server = await axios.get(EVE_SERVER_STATUS_API);

      if (server.status !== 200) {
        functions.logger.warn(
          "Eve Servers Offline - Unable To Refresh Item History"
        );
        return null;
      }

      const successfulIDs = new Set();
      const failedIDs = new Set();

      for (let [typeID] of Object.entries(pricingData)) {
        const response = await ESIMarketHistoryQuery(typeID);
        if (response === "fail") {
          failedIDs.add(typeID);
          continue;
        }
        successfulIDs.add(typeID);
      }

      functions.logger.log(
        `Market History Refreshed For ${
          successfulIDs.size
        } Items. ${JSON.stringify([...successfulIDs])}`
      );

      if (failedIDs.size > 0) {
        functions.logger.log(
          ` Market History Refresh Failed For ${
            failedIDs.size
          } Items. ${JSON.stringify([...failedIDs])}`
        );
      }
    } catch (err) {}
    returnObject = {
      average: 0,
      highest: 0,
      lowsest: 0,
      lastUpdated: 0,
      orderCount: 0,
    };
  });
