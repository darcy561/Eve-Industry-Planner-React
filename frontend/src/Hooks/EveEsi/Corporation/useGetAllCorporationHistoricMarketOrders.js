import {
  corporationHistoricMarketOrdersQuery,
  corporationHistoricMarketOrdersQueryKey,
} from "../../React Query/Corporation/historicMarketOrders";
import {
  readCorporationCollection,
  useCorporationCollection,
} from "./corporationCollection";

/**
 * Reads every tracked corporation's cached historic market orders without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function getAllCachedCorporationHistoricMarketOrders(queryClient) {
  return readCorporationCollection(
    queryClient,
    corporationHistoricMarketOrdersQueryKey,
  );
}

/**
 * Fetches every tracked corporation's historic market orders, once per corporation.
 *
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function useGetAllCorporationHistoricMarketOrders() {
  return useCorporationCollection(corporationHistoricMarketOrdersQuery);
}
