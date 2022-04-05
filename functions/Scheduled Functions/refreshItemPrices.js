const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketQuery = require("../Item Prices/priceData").ESIMarketQuery;
const axios = require("axios");

exports.scheduledFunction = functions.pubsub
  .schedule("every 2 hours")
  .onRun(async (context) => {
    let refreshPoint = Date.now() - 14400000;
    const itemsToRefresh = await admin
      .firestore()
      .collection("Pricing")
      .where("lastUpdated", "<", refreshPoint)
      .orderBy("lastUpdated", "asc")
      .limit(300)
      .get();
    let refreshData = [];
    itemsToRefresh.forEach((item) => {
      refreshData.push(item.data());
    });
    const server = await axios.get(
      "https://esi.evetech.net/latest/status/?datasource=tranquility"
    );
    let successRefreshCount = 0;
    let failedRefreshCount = 0;
    let refreshedIDs = [];
    let failedIDs = [];
    if (server.status === 200) {
      for (let item of refreshData) {
        if (item.lastUpdated < Date.now() - 14400000) {
          let response = await ESIMarketQuery(item.typeID, item);
          if (response === "fail") {
            failedRefreshCount++;
            failedIDs.push(item.typeID, server.status);
          }
          successRefreshCount++;
          refreshedIDs.push(item.typeID);
        }
      }
    } else {
      refreshData.forEach((i) => {
        failedIDs.push(i.typeID, server.status);
      });
      failedRefreshCount++;
      functions.logger.error(`Eve Servers Offline`);
    }
    functions.logger.info(
      `Number of TypeID's Refreshed ${successRefreshCount}`
    );
    functions.logger.info(`TypeID's Refreshed ${JSON.stringify(refreshedIDs)}`);
    if (failedRefreshCount > 0) {
      functions.logger.warn(`Number of TypeID's Failed ${failedRefreshCount}`);
      functions.logger.warn(`TypeID's Failed ${JSON.stringify(failedIDs)}`);
    }

    return null;
  });
