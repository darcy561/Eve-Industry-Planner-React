const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

async function ESIItemAdjustedPriceQuery() {
  try {
    const responseData = await fetchAdjustedPrices();
    if (!responseData) return null;

    const databaseObject = buildDatabaseObject(responseData);

    await saveAdjustedPriceToDatabase(databaseObject);

    return databaseObject;
  } catch (err) {
    functions.logger.error(`An error occured: ${err}`);
    return null;
  }
}

async function fetchAdjustedPrices() {
  try {
    const response = await axios.get(
      `https://esi.evetech.net/latest/markets/prices/`
    );
    if (response.status !== 200) return null;

    return [...response.data];
  } catch (err) {
    functions.logger.error(err);
    return null;
  }
}

function buildDatabaseObject(initialArray) {
  const hashObject = {};

  for (let i = 0; i < initialArray.length; i++) {
    const item = initialArray[i];

    hashObject[item.type_id] = item;
  }

  return hashObject;
}

async function saveAdjustedPriceToDatabase(databaseObject) {
  try {
    await admin.database().ref(`live-data/adjusted-prices`).set(databaseObject);
  } catch (err) {
    functions.logger.error(err);
  }
}

module.exports = {
  ESIItemAdjustedPriceQuery,
};
