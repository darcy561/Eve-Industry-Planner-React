const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { ESIMarketQuery } = require("../sharedFunctions/fetchMarketPrices");
const axios = require("axios");
const { GLOBAL_CONFIG } = require("../global-config-functions");

const {
  FIREBASE_SERVER_REGION,
  FIREBASE_SERVER_TIMEZONE,
  DEFAULT_ITEM_PRICE_REFRESH_PERIOD,
  DEFAULT_ITEM_MARKET_REFRESH_QUANTITY,
} = GLOBAL_CONFIG;

const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";
const MARKET_PRICES_REF = "live-data/market-prices";
const TIME_LIMIT = DEFAULT_ITEM_PRICE_REFRESH_PERIOD * 60 * 60 * 1000;

exports.scheduledFunction = functions
  .region(FIREBASE_SERVER_REGION)
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 10 minutes")
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
        functions.logger.log("No TypeID's Found To Refresh");
        return null;
      }

      const server = await axios.get(EVE_SERVER_STATUS_API);

      if (server.status !== 200) {
        functions.logger.warn(
          "Eve Servers Offline - Unable To Refresh Item Prices"
        );
        return null;
      }

      const refreshedIDs = new Set();
      const failedIDs = new Set();

      for (const [typeID] of Object.entries(pricingData)) {
        if (!typeID) {
          continue;
        }
        const response = await ESIMarketQuery(typeID);
        if (!response) {
          failedIDs.add(typeID);
          continue;
        }
        refreshedIDs.add(typeID);
      }

      functions.logger.log(
        `Market Prices Refreshed For ${
          refreshedIDs.size
        } Items. ${JSON.stringify([...refreshedIDs])}`
      );
      if (failedIDs.size > 0) {
        functions.logger.log(
          `Market Prices Refresh Failed For ${
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
