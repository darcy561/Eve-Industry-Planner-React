import { ref } from ("firebase/database");
import { error } from ("firebase-functions/logger");
import axios from "axios";
import { DEFAULT_MARKET_LOCATIONS, ESI_MAX_PAGES } from ("../global-config-functions");


async function ESIMarketQuery(typeID, selectedDatabase) {
  const dbObject = { typeID: Number(typeID), lastUpdated: Date.now() };

  const promises = DEFAULT_MARKET_LOCATIONS.map((location) =>
    fetchMarketOrders(typeID, location.regionID)
  );
  const responses = await Promise.all(promises);

  for (let i = 0; i < responses.length; i++) {
    const location = DEFAULT_MARKET_LOCATIONS[i];
    const orders = responses[i];

    if (!orders) {
      continue;
    }
    const { buyOrders, sellOrders } = filterOrders(orders, location.stationID);
    const { highestBuyPrice, lowestSellPrice } =
      getHighestBuyAndLowestSellPrices(buyOrders, sellOrders);
    dbObject[location.name] = { buy: highestBuyPrice, sell: lowestSellPrice };
  }
  await saveMarketPricesToDatabase(typeID, dbObject, selectedDatabase);

  return dbObject;
}

async function fetchMarketOrders(typeID, regionID) {
  const maxEntries = 1000;
  let orders = [];
  for (let pageCount = 1; pageCount <= ESI_MAX_PAGES; pageCount++) {
    try {
      const response = await axios.get(
        `https://esi.evetech.net/latest/markets/${regionID}/orders/?datasource=tranquility&order_type=all&page=${pageCount}&type_id=${typeID}`
      );
      if (response.status !== 200) break;
      orders.push(...response.data);
      if (response.data.length < maxEntries) {
        break;
      }
    } catch (err) {
      error(err);
      break;
    }
  }
  return orders;
}

function filterOrders(orders, stationID) {
  const buyOrders = [];
  const sellOrders = [];

  for (let order of orders) {
    if (order.location_id === stationID) {
      if (order.is_buy_order) {
        buyOrders.push(order);
      } else {
        sellOrders.push(order);
      }
    }
  }
  return { buyOrders, sellOrders };
}

function getHighestBuyAndLowestSellPrices(buyOrders, sellOrders) {
  const highestBuyPrice =
    buyOrders.length > 0 ? Math.max(...buyOrders.map((o) => o.price)) : 0;
  const lowestSellPrice =
    sellOrders.length > 0 ? Math.min(...sellOrders.map((o) => o.price)) : 0;
  return { highestBuyPrice, lowestSellPrice };
}

async function saveMarketPricesToDatabase(
  typeID,
  marketPrices,
  selectedDatabase
) {
  try {
    await ref(
      selectedDatabase,
      `live-data/market-prices/${typeID.toString()}`
    ).set(marketPrices);
  } catch (err) {
    error(err);
  }
}

export default ESIMarketQuery;