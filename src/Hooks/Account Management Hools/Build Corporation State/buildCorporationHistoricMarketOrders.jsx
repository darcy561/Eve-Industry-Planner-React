export function buildCorporatioHistoricnMarketOrders_AccountManagement(corporationMap) {
    const returnMap = new Map();
  
    corporationMap.forEach((userObjectsArray, corporation_id) => {
      const includedCorporationJobs = {};
      userObjectsArray.forEach(({ esiCorpMOrders }) => {
        esiCorpMOrders.forEach((corpOrder) => {
          includedCorporationJobs[corpOrder.order_id] = corpOrder;
        });
      });
      returnMap.set(corporation_id, includedCorporationJobs);
    });
  
    return returnMap;
  }
  