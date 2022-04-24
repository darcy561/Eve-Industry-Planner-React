const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketQuery = require("../Item Prices/priceData").ESIMarketQuery;
const axios = require("axios");

exports.scheduledFunction = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    const pricingDoc = await admin.firestore().doc("Pricing/Live").get();
    if (pricingDoc.exists) {
      let pricingDocData = pricingDoc.data();
      const server = await axios.get(
        "https://esi.evetech.net/latest/status/?datasource=tranquility"
      );
      let successRefreshCount = 0;
      let failedRefreshCount = 0;
      let refreshList = [];
      let refreshedIDs = [];
      let failedIDs = [];
      if (server.status === 200) {
        for (let item in pricingDocData) {
          if (
            (pricingDocData[item].lastUpdated < Date.now() - 14400000) &
            (refreshList.length <= 300)
          ) {
            refreshList.push(pricingDocData[item].typeID);
          }
        }
        if (refreshList.length > 0) {
          for (let typeID of refreshList) {
            let response = await ESIMarketQuery(typeID, pricingDocData[typeID]);
            if (response === "fail") {
              failedRefreshCount++;
              failedIDs.push(typeID);
            }
            successRefreshCount++;
            refreshedIDs.push(typeID);
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
      functions.logger.info(
        `TypeID's Refreshed ${JSON.stringify(refreshedIDs)}`
      );
      if (failedRefreshCount > 0) {
        functions.logger.warn(
          `Number of TypeID's Failed ${failedRefreshCount}`
        );
        functions.logger.warn(`TypeID's Failed ${JSON.stringify(failedIDs)}`);
      }

      return null;
    }
  });
