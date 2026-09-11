import {
  corporationMarketOrdersQuery,
  corporationMarketOrdersQueryKey,
} from "../../React Query/Corporation/marketOrders";
import {
  readCorporationCollection,
  useCorporationCollection,
} from "./corporationCollection";

/**
 * Reads every tracked corporation's cached market orders without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function getAllCachedCorporationMarketOrders(queryClient) {
  return readCorporationCollection(
    queryClient,
    corporationMarketOrdersQueryKey,
  );
}

/**
 * Fetches every tracked corporation's market orders, once per corporation.
 *
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function useGetAllCorporationMarketOrders() {
  return useCorporationCollection(corporationMarketOrdersQuery);
}
