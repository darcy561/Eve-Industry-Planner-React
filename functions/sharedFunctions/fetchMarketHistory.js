import { ref } from "firebase/database";
import { error } from "firebase-functions/logger";
import axios from "axios";
import { DEFAULT_MARKET_LOCATIONS, DEFAULT_DAYS_FOR_MARKET_HISTORY } from ("../global-config-functions");


async function ESIMarketHistoryQuery(typeID, selectedDatabase) {
  try {
    const dbObject = { typeID: Number(typeID), lastUpdated: Date.now() };

    const promises = DEFAULT_MARKET_LOCATIONS.map((location) =>
      fetchMarketHistory(typeID, location.regionID)
    );

    const responses = await Promise.all(promises);  

    for (let i = 0; i < responses.length; i++) {
      const location = DEFAULT_MARKET_LOCATIONS[i];
      const rawMarketData = responses[i];
      if (!rawMarketData) {
        continue;
      }

      const marketData = filterOldEntries(rawMarketData);
      const { highestMarketPrice, lowestMarketPrice } =
        getHighestAndLowestMarketPrices(marketData);
      const {
        dailyAverageUnitCount,
        dailyAverageOrderQuantity,
        dailyAverageMarketPrice,
      } = getAverageMarketData(marketData);

      dbObject[location.name] = {
        highestMarketPrice,
        lowestMarketPrice,
        dailyAverageUnitCount,
        dailyAverageOrderQuantity,
        dailyAverageMarketPrice,
      };
    }
    await saveMarketHistoryToDatabase(typeID, dbObject, selectedDatabase);
    return dbObject;
  } catch (err) {
   error(`An error occured: ${err}`);
    return null;
  }
}

async function fetchMarketHistory(typeID, regionID) {
  try {
    const response = await axios.get(
      `https://esi.evetech.net/latest/markets/${regionID}/history/?datasource=tranquility&type_id=${typeID}`
    );

    if (response.status !== 200) return null;
    return [...response.data];
  } catch (err) {
    error(err);
    return null;
  }
}

function filterOldEntries(rawMarketData) {
  const currentDate = Date.now();
  const chosenTimePeriod =
    currentDate - DEFAULT_DAYS_FOR_MARKET_HISTORY * 60 * 60 * 1000;

  return rawMarketData.filter((ob) => Date.parse(ob.date) <= chosenTimePeriod);
}

function getHighestAndLowestMarketPrices(marketData) {
  const highestMarketPrice =
    marketData.length > 0 ? Math.max(...marketData.map((i) => i.highest)) : 0;

  const lowestMarketPrice =
    marketData.length > 0 ? Math.min(...marketData.map((i) => i.lowest)) : 0;

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

  const dailyAverageMarketPrice =
    Math.round((sumAverage / marketData.length + Number.EPSILON) * 100) / 100 ||
    0;
  const dailyAverageOrderQuantity =
    Math.round((sumOrderCount / marketData.length + Number.EPSILON) * 100) /
      100 || 0;
  const dailyAverageUnitCount =
    Math.round((sumVolume / marketData.length + Number.EPSILON) * 100) / 100 ||
    0;

  return {
    dailyAverageMarketPrice,
    dailyAverageOrderQuantity,
    dailyAverageUnitCount,
  };
}

async function saveMarketHistoryToDatabase(typeID, dbObject, selectedDatabase) {
  try {
    await 
      ref(selectedDatabase, `live-data/market-history/${typeID.toString()}`)
      .set(dbObject);
  } catch (err) {
    error(err);
  }
}

export default ESIMarketHistoryQuery;

