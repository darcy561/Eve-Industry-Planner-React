const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

async function ESIMarketQuery(typeID, newItem) {
  const maxPages = 50;
  const maxEntries = 1000;
  const locations = [
    { name: "jita", regionID: 10000002, stationID: 60003760 },
    { name: "amarr", regionID: 10000043, stationID: 60008494 },
    { name: "dodixie", regionID: 10000032, stationID: 60011866 },
  ];

  const dbObject = { typeID: Number(typeID), lastUpdated: Date.now() };
  const promises = locations.map((location) =>
    fetchMarketOrders(typeID, location)
  );
  const responses = await Promise.all(promises);

  for (let i = 0; i < responses.length; i++) {
    const location = locations[i];
    const orders = responses[i];

    if (!orders) {
      return "fail";
    }
    const { buyOrders, sellOrders } = filterOrders(orders, location.stationID);
    const { highestBuyPrice, lowestSellPrice } =
      getHighestBuyAndLowestSellPrices(buyOrders, sellOrders);
    dbObject[location.name] = { buy: highestBuyPrice, sell: lowestSellPrice };
  }
  await saveMarketPricesToDatabase(typeID, dbObject);

  return dbObject;

  async function fetchMarketOrders(typeID, location) {
    let orders = [];
    for (let pageCount = 1; pageCount <= maxPages; pageCount++) {
      try {
        const response = await axios.get(
          `https://esi.evetech.net/latest/markets/${location.regionID}/orders/?datasource=tranquility&order_type=all&page=${pageCount}&type_id=${typeID}`
        );
        if (response.status !== 200) break;
        orders.push(...response.data);
        if (response.data.length < maxEntries) {
          break;
        }
      } catch (err) {
        functions.logger.error(err);
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

  async function saveMarketPricesToDatabase(typeID, marketPrices) {
    try {
      if (newItem) {
        await admin.database().ref(`market-prices/${typeID}`).set(marketPrices);
      }
    } catch (err) {
      functions.logger.error(err);
    }
  }
}

module.exports = {
  ESIMarketQuery: ESIMarketQuery,
};
