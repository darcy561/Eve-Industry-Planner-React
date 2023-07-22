const { GLOBAL_CONFIG } = require("../global-config-functions");
const admin = require("firebasse-admin");
const functions = require("firebase-functions");
const {
  ESIMarketHistoryQuery,
} = require("../sharedFunctions/fetchMarketHistory");

const {
  FIREBASE_SERVER_REGION,
  FIREBASE_SERVER_TIMEZONE,
  DEFAULT_ITEM_PRICE_REFRESH_PERIOD,
  DEFAULT_ITEM_MARKET_REFRESH_QUANTITY,
} = GLOBAL_CONFIG;
const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";
const MARKET_PRICES_REF = "live-data/market-history";
const TIME_LIMIT = DEFAUL_ITEM_HISTROY_REFRESH_PERIOD * 60 * 60 * 1000;

exports.scheduledFunction = functions
  .region(FIREBASE_SERVER_REGION)
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 30 minutes")
  .timeZone(FIREBASE_SERVER_TIMEZONE)
  .onRun(async (context) => {
    try {
      const pricingSnapshot = await admin
        .database()
        .ref(MARKET_PRICES_REF)
        .orderByChild("lastUpdated")
        .endAt(Date.now() - TIME_LIMIT)
        .limitToLast(DEFAULT_ITEM_MARKET_REFRESH_QUANTITY)
        .once("value");

      let pricingData = pricingSnapshot.val();

      if (!pricingData) {
        return null;
      }

      if (pricingData.length === 0) {
        functions.logger.log("No TypeID's Found To Convert");
        return null;
      }

      const server = await axios.get(EVE_SERVER_STATUS_API);

      if (server.status !== 200) {
        functions.logger.warn(
          "Eve Servers Offline - Unable To Refresh Item Prices"
        );
        return null;
      }

      const successfulIDs = new Set();
      const failedIDs = new Set();

      for (const [typeID] of Object.entries(pricingData)) {
        const response = await ESIMarketHistoryQuery(typeID);
        if (!response) {
          failedIDs.add(typeID);
          continue;
        }
        successfulIDs.add(typeID);
      }

      functions.logger.log(
        `Market History Added For ${successfulIDs.size} Items. ${JSON.stringify(
          [...successfulIDs]
        )}`
      );

      if (failedIDs.size > 0) {
        functions.logger.log(
          ` Market History Addition Failed For ${
            failedIDs.size
          } Items. ${JSON.stringify([...failedIDs])}`
        );
      }
      return null;
    } catch (err) {
      functions.logger.error(`An error occured: ${err}`);
      return null;
    }
  });
