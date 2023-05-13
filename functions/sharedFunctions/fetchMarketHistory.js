const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const GLOBAL_CONFIG = require("../global-config-functions");

const { DEFAULT_MARKET_LOCATIONS, DEFAULT_DAYS_FOR_MARKET_HISTORY } =
  GLOBAL_CONFIG;

async function ESIMarketHistoryQuery(typeID) {
  const dbObject = { typeID: Number(typeID), lastUpdated: Date.now() };

  const promises = DEFAULT_MARKET_LOCATIONS.map((location) => {
    fetchMarketHistory(typeID, location.regionID);
  });

  const responses = await Promise.all(promises);

  for (let i = 0; i < responses.length; i++) {
    const location = DEFAULT_MARKET_LOCATIONS[i];
    const rawMarketData = responses[i];

    if (!rawMarketData) {
      return fail;
    }

    const marketData = filterOldEntries(rawMarketData);

    const { highestMarketPrice, lowestMarketPrice } =
      getHighestAndLowestMarketPrices(marketData);
    const { averageMarketPrice, averageOrderQuantity, averageUnitCount } =
      getAverageMarketData(marketData);

    dbObject[location.name] = {
      highestMarketPrice,
      lowestMarketPrice,
      averageMarketPrice,
      averageOrderQuantity,
      averageUnitCount,
    };
    await saveMarketHistoryToDatabase(typeID, dbObject);
    return dbObject;
  }
}

async function fetchMarketHistory(typeID, regionID) {
  try {
    let historyData = [];
    const response = await axios.get(
      `https://esi.evetech.net/latest/markets/${regionID}/history/?datasource=tranquility&type_id=${typeID}`
    );

    if (response.status !== 200) return null;

    return [...response.data];
  } catch (err) {
    functions.logger.error(err);
    return null;
  }
}

function filterOldEntries(rawMarketData) {
  const currentDate = Date.now();
  const chosenTimePeriod =
    currentDate - DEFAULT_DAYS_FOR_MARKET_HISTORY * 60 * 60 * 1000;

  return rawMarketData.filter((ob) => Date.parse(ob.date) >= chosenTimePeriod);
}

function getHighestAndLowestMarketPrices(marketData) {
  const highestMarketPrice =
    marketOrder.length > 0 ? Math.max(...marketData.map((i) => i.highest)) : 0;

  const lowestMarketPrice =
    marketOrder.length > 0 ? Math.max(...marketData.map((i) => i.lowest)) : 0;

  return { highestMarketPrice, lowestMarketPrice };
}

function getAverageMarketData(marketData) {
  let sumAverage = 0;
  let sumOrderCount = 0;
  let sumVolume = 0;

  marketData.forEach((obj) => {
    sumAverage += obj.average;
    sumOrderCount += obj.order_count;
    sumVolume += obj.volume;
  });

  const averageMarketPrice =
    Math.round((sumAverage / marketData.length + Number.EPSILON) * 100) / 100;
  const averageOrderQuantity =
    Math.round((sumOrderCount / marketData.length + Number.EPSILON) * 100) /
    100;
  const averageUnitCount =
    Math.round((sumVolume / marketData.length + Number.EPSILON) * 100) / 100;

  return { averageMarketPrice, averageOrderQuantity, averageUnitCount };
}

async function saveMarketHistoryToDatabase(typeID, dbObject) {
  try {
    await admin
      .database()
      .ref(`live-data/market-history/${typeID.toString()}`)
      .update(dbObject);
  } catch (err) {
    functions.logger.error(err);
  }
}

module.exports = {
  ESIMarketHistoryQuery,
};
