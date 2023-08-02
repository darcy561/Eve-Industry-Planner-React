const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { GLOBAL_CONFIG } = require("../global-config-functions");

const {FIREBASE_SERVER_REGION, FIREBASE_SERVER_TIMEZONE} = GLOBAL_CONFIG

const EVE_SERVER_STATUS_API =
  "https://esi.evetech.net/latest/status/?datasource=tranquility";
const EVE_SYSTEM_INDEX_API =
  "https://esi.evetech.net/latest/industry/systems/?datasource=tranquility";
const SYSTEM_INDEXES_REF = "live-data/system-indexes";

exports.scheduledFunction = functions
  .region(FIREBASE_SERVER_REGION)
  .pubsub.schedule("every 1 hours")
  .timeZone(FIREBASE_SERVER_TIMEZONE)
  .onRun(async (context) => {
    try {
      const eveServerResponse = await axios.get(EVE_SERVER_STATUS_API);
      if (eveServerResponse.status !== 200) {
        functions.logger.error(
          "Eve Servers Offline - Unable To Refresh System Indexes"
        );
        return null;
      }
      const systemIndexResults = await axios.get(EVE_SYSTEM_INDEX_API);

      if (systemIndexResults.status !== 200) {
        functions.logger.error("System Indexes Data Update Failed");
      }
      let systemIndexData = systemIndexResults.data;

      for (const system of systemIndexData) {
        const { solar_system_id } = system;
        const updates = { solar_system_id };

        system.cost_indices.forEach((costIndex) => {
          const { activity, cost_index } = costIndex;
          updates[activity] = cost_index;
        });
        updates["lastUpdated"] = Date.now();
        await admin
          .database()
          .ref(SYSTEM_INDEXES_REF)
          .child(solar_system_id)
          .set(updates);
      }

      functions.logger.info("System Indexes Data Updated Successfully");

      return null;
    } catch (err) {
      functions.logger.error(`An error occured: ${err}`);
      return null;
    }
  });
