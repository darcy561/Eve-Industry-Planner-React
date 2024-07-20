import { getDatabase } from "firebase-admin/database";
import { error, log, warn } from "firebase-functions/logger";
import { get, ref } from "firebase/database";
import ESIMarketQuery from "../../sharedFunctions/fetchMarketPrices.js";
import ESIMarketHistoryQuery from "../../sharedFunctions/fetchMarketHistory.js";
import { DEFAULT_MARKET_LOCATIONS } from "../../global-config-functions.js";

async function marketData(req, res) {
  try {
    const db = getDatabase();

    const { idArray: requestedIDs } = req.body;
    if (
      !requestedIDs ||
      !Array.isArray(requestedIDs) ||
      requestedIDs.length === 0
    ) {
      return res.status(400).send("Invalid or empty ID array");
    }

    const databaseMarketPricesQueryPromises = requestedIDs.map((id) =>
      get(ref(db, `live-data/market-prices/${id}`))
    );
    const databaseMarketHistoryQueryPromises = requestedIDs.map((id) =>
      get(ref(db, `live-data/market-history/${id}`))
    );
    const databaseAdjustedPricesQueryPromises = requestedIDs.map((id) =>
      get(ref(db, `live-data/adjusted-prices/${id}`))
    );

    const databaseMarketPricesQueryResolves = await Promise.all(
      databaseMarketPricesQueryPromises
    );
    const databaseMarketHistoryQueryResolves = await Promise.all(
      databaseMarketHistoryQueryPromises
    );
    const databaseAdjustedPricesQueryResolves = await Promise.all(
      databaseAdjustedPricesQueryPromises
    );

    const { returnData: databaseResults, missingData: missingIDs } =
      meregeReturnPromises(
        requestedIDs,
        databaseMarketPricesQueryResolves,
        databaseMarketHistoryQueryResolves,
        databaseAdjustedPricesQueryResolves,
        true
      );

    const missingPricePromises = missingIDs.map((id) =>
      ESIMarketQuery(id.toString(), db)
    );
    const missingHistoryPromises = missingIDs.map((id) =>
      ESIMarketHistoryQuery(id.toString(), db)
    );

    const missingPriceResolves = await Promise.all(missingPricePromises);
    const missingHistoryResolves = await Promise.all(missingHistoryPromises);

    const { returnData: esiResults, missingData: failedToRetrieve } =
      meregeReturnPromises(
        missingIDs,
        missingPriceResolves,
        missingHistoryResolves,
        databaseAdjustedPricesQueryResolves,
        false
      );

    const returnData = [...databaseResults, ...esiResults];

    log(
      `${returnData.length} Market Objects Returned for ${req.header(
        "accountID"
      )}, [${requestedIDs}]`
    );

    if (failedToRetrieve.length > 0) {
      warn(`${failedToRetrieve.length} Market Objects Could Not Be Found`);
    }

    function meregeReturnPromises(
      requestedIDS,
      marketPricesData,
      marketHistoryData,
      adjustedPriceData,
      fromDatabase
    ) {
      const missingData = [];
      const returnData = [];

      requestedIDLoop: for (let i in requestedIDS) {
        let marketPrices = null;
        let marketHistory = null;
        let adjustedPrice = null;

        if (fromDatabase) {
          marketPrices = marketPricesData[i]?.val() || null;
          marketHistory = marketHistoryData[i]?.val() || null;
          adjustedPrice = adjustedPriceData[i]?.val() || null;
        } else {
          marketPrices = marketPricesData[i] || null;
          marketHistory = marketHistoryData[i] || null;
          adjustedPrice = adjustedPriceData[i]?.val() || null;
        }

        if (!marketPrices || !marketHistory) {
          missingData.push(requestedIDS[i]);
          continue;
        }

        let outputObject = { ...marketPrices };
        outputObject.adjustedPrice = adjustedPrice?.adjusted_price || 0;
        for (let location of DEFAULT_MARKET_LOCATIONS) {
          if (fromDatabase && !marketHistory[location.name]) {
            missingData.push(requestedIDS[i]);
            continue requestedIDLoop;
          }

          const {
            dailyAverageMarketPrice,
            highestMarketPrice,
            lowestMarketPrice,
            dailyAverageOrderQuantity,
            dailyAverageUnitCount,
          } = marketHistory[location.name];

          outputObject[location.name] = {
            ...outputObject[location.name],
            dailyAverageMarketPrice,
            highestMarketPrice,
            lowestMarketPrice,
            dailyAverageOrderQuantity,
            dailyAverageUnitCount,
          };
        }

        returnData.push(outputObject);
      }

      return { returnData, missingData };
    }

    return res.status(200).json(returnData);
  } catch (err) {
    error(err);
    return res
      .status(500)
      .send("Error retrieving market data, please try again.");
  }
}

export default marketData;
