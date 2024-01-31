import { buildCorporatioHistoricnMarketOrders_AccountManagement } from "./Build Corporation State/buildCorporationHistoricMarketOrders";
import { buildCorporationIndustyJobs_AccountManagement } from "./Build Corporation State/buildCorporationIndustryJobs";
import { buildCorporationMarketOrders_AccountManagement } from "./Build Corporation State/buildCorporationMarketOrders";

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

    const corpIndustyJobs =
      buildCorporationIndustyJobs_AccountManagement(groupedByCorporation);
    const corpMarketOrders = buildCorporationMarketOrders_AccountManagement(groupedByCorporation)
    const corpHistoricMarketOrders = buildCorporatioHistoricnMarketOrders_AccountManagement(groupedByCorporation)
    return { corpIndustyJobs, corpMarketOrders, corpHistoricMarketOrders };
  }

  return buildCorporationState;
}
