import {
  corporationTransactionsQuery,
  corporationTransactionsQueryKey,
} from "../../React Query/Corporation/transactions";
import { CORPORATION_WALLET_DIVISIONS } from "../../React Query/Corporation/journal";
import {
  readCorporationCollection,
  useCorporationCollection,
} from "./corporationCollection";

/**
 * Reads every tracked corporation's cached transactions without triggering a fetch.
 *
 * Keyed per wallet division, so each division is fetched once by a member who can read it.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function getAllCachedCorporationTransactions(queryClient) {
  return readCorporationCollection(queryClient, corporationTransactionsQueryKey, CORPORATION_WALLET_DIVISIONS);
}

/**
 * Fetches every tracked corporation's transactions, once per corporation.
 *
 * Keyed per wallet division, so each division is fetched once by a member who can read it.
 *
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function useGetAllCorporationTransactions() {
  return useCorporationCollection(corporationTransactionsQuery, CORPORATION_WALLET_DIVISIONS);
}
