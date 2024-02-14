export function useBuildCorporationState() {
  function buildCorporationState(esiObjectArray) {
    const groupedByCorporation = new Map();

    esiObjectArray.forEach((userObject) => {
      const { corporation_id } = userObject;

      if (groupedByCorporation.has(corporation_id)) {
        groupedByCorporation.get(corporation_id).push(userObject);
      } else {
        groupedByCorporation.set(corporation_id, [userObject]);
      }
    });

    const corpIndustyJobs = organiseCorporationData(
      groupedByCorporation,
      "esiCorpJobs",
      "job_id"
    );
    const corpMarketOrders = organiseCorporationData(
      groupedByCorporation,
      "esiCorpMOrders",
      "order_id"
    );
    const corpHistoricMarketOrders = organiseCorporationData(
      groupedByCorporation,
      "esiCorpHistMOrders",
      "order_id"
    );
    const corpBlueprints = organiseCorporationData(
      groupedByCorporation,
      "esiCorpBlueprints",
      "item_id"
    );

    return {
      corpIndustyJobs,
      corpMarketOrders,
      corpHistoricMarketOrders,
      corpBlueprints,
    };
  }

  function organiseCorporationData(
    corporationMap,
    requiredAttribute,
    key
  ) {
    const returnMap = new Map();

    corporationMap.forEach((userObjectArray, corporation_id) => {
      const includedCorporationData = {};
      userObjectArray.forEach((userObject) => {
        const data = userObject[requiredAttribute];
        if (!Array.isArray(data)) return;
        data.forEach((item) => {
          if (includedCorporationData[item[key]]) {
            includedCorporationData[item[key]].owners.push(
              userObject.owner
            );
          } else {
            includedCorporationData[item[key]] = item;
            includedCorporationData[item[key]].owners = [
              userObject.owner,
            ];
          }
        });
      });
      returnMap.set(corporation_id, includedCorporationData);
    });

    return returnMap;
  }

  return buildCorporationState;
}
