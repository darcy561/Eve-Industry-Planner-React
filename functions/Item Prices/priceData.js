const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const { NorthWest } = require("@mui/icons-material");

async function ESIMarketQuery(typeID){
  const locations = [
    { name: "jita", regionID: "10000002", stationID: "60003760" },
    { name: "amarr", regionID: "10000043", stationID: "60008494" },
    { name: "dodixie", regionID: "10000032", stationID: "60011866" },
  ]
  let dbObject = { typeID: Number(typeID), lastUpdated: Date.now() };
  for (let location of locations) {
    let pageCount = 1;
    let buyOrders = [];
    let sellOrders = [];
    while (pageCount <= 50) {
      try {
        const response = await axios.get(
          `https://esi.evetech.net/latest/markets/${location.regionID}/orders/?datasource=tranquility&order_type=all&page=${pageCount}&type_id=${typeID}`
        );
        if (response.status === 200) {
          response.data.filter((i) => i.location_id === location.stationID);
          response.data.forEach((order) => {
            if (order.is_buy_order) {
              buyOrders.push(order);
            } else {
              sellOrders.push(order);
            }
          });
          if (response.data.length < 1000) {
            pageCount = 51;
          } else {
            pageCount++;
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
    if (buyOrders.length > 0) {
      buyOrders.sort((a, b) => {
        return b.price - a.price;
      });
    }
    if (sellOrders.length > 0) {
      sellOrders.sort((a, b) => {
        return a.price - b.price;
      });
    }
    Object.assign(dbObject, {
      [location.name]: {
        buy: buyOrders.length ? buyOrders[0].price : 0,
        sell: sellOrders.length ? sellOrders[0].price : 0,
      },
    });
  }
  await admin.firestore().doc(`Pricing/${typeID}`).set(dbObject);
  return dbObject;
}

module.exports = {
  ESIMarketQuery: ESIMarketQuery,
};
