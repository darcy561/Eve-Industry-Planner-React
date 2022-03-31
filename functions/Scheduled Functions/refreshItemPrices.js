const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketQuery = require("../Item Prices/priceData").ESIMarketQuery;
const axios = require("axios");

exports.scheduledFunction = functions.pubsub
  .schedule("every 5 minutes")
  .runWith({ maxInstances: 1, timeoutSeconds: 540, memory: "128MB" })
  .onRun((context) => {
    async () => {
      const itemsToRefresh = await admin.firestore
        .collection("Pricing")
        .where("lastUpdated", "<", `${Date.now - 14_400_000}`)
        .limit(1)
        .get();
      let refreshData = [];
      itemsToRefresh.forEach((item) => {
        refreshData.push(item.data());
      });
      functions.logger.info(JSON.stringify(refreshData));
      const server = await axios.get(
        "https://esi.evetech.net/latest/status/?datasource=tranquility"
      );

      if (server.status === 200) {
        for (let item of refreshData) {
          await ESIMarketQuery(item.typeID);
        }
      }
    };
    return null;
  });
