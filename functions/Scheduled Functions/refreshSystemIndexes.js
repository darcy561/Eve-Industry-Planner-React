const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const bucket = admin.storage().bucket();

exports.scheduledFunction = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    try {
      const server = await axios.get(
        "https://esi.evetech.net/latest/status/?datasource=tranquility"
      );
      if (server.status === 200) {
        const data = await axios.get(
          "https://esi.evetech.net/latest/industry/systems/?datasource=tranquility"
        );
        if (data.status === 200) {
          bucket.file("systemIndexes.json").save(JSON.stringify(data.data));
          functions.logger.info("System Indexes Data Updated Successfully");
        } else {
          functions.logger.error("System Indexes Data Update Failed");
        }
      } else {
        functions.logger.error("Eve Servers Offline - Refresh System Indexes");
      }
      return null;
    } catch (err) {
      functions.logger.error(err);
    }
  });
