const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ESIMarketQuery = require("../sharedFunctions/priceData").ESIMarketQuery;
const axios = require("axios");

exports.scheduledFunction = functions
  .region("europe-west1")
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 30 minutes")
  .timeZone("Etc/GMT")
  .onRun(async (context) => {
    const pricingSnapshot = await admin
      .database()
      .ref("market-prices")
      .orderByChild("lastUpdated")
      .endAt(Date.now() - 14400000)
      .limitToLast(150)
      .once("value");

    let pricingData = pricingSnapshot.val();

    if (pricingData === null) {
      return null;
    }

    const server = await axios.get(
      "https://esi.evetech.net/latest/status/?datasource=tranquility"
    );

    if (server.status !== 200) {
      functions.logger.error(
        "Eve Servers Offline - Unable To Refresh Item Prices"
      );
      return null;
    }

    let successRefreshCount = 0;
    let failedRefreshCount = 0;
    const refreshedIDs = [];
    const failedIDs = [];

    for (let { typeID } in pricingData) {
      let response = await ESIMarketQuery(typeID, false, pricingData[typeID]);

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
      await admin.database().ref("market-prices").update(pricingData);
    }

    functions.logger.info(
      `Number of TypeID's Refreshed ${successRefreshCount}. TypeID's Refreshed ${JSON.stringify(
        refreshedIDs
      )}`
    );

    if (failedRefreshCount > 0) {
      functions.logger.info(
        `Number of TypeID's Failed ${failedRefreshCount}. TypeID's Failed ${JSON.stringify(
          failedIDs
        )}`
      );
    }

    return null;
  });
