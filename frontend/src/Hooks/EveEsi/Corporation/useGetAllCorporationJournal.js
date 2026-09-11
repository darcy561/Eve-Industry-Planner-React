import {
  corporationJournalQuery,
  corporationJournalQueryKey,
  CORPORATION_WALLET_DIVISIONS,
} from "../../React Query/Corporation/journal";
import {
  readCorporationCollection,
  useCorporationCollection,
} from "./corporationCollection";

/**
 * Reads every tracked corporation's cached journal entries without triggering a fetch.
 *
 * Keyed per wallet division, so each division is fetched once by a member who can read it.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function getAllCachedCorporationJournal(queryClient) {
  return readCorporationCollection(
    queryClient,
    corporationJournalQueryKey,
    CORPORATION_WALLET_DIVISIONS,
  );
}

/**
 * Fetches every tracked corporation's journal entries, once per corporation.
 *
 * Keyed per wallet division, so each division is fetched once by a member who can read it.
 *
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function useGetAllCorporationJournal() {
  return useCorporationCollection(
    corporationJournalQuery,
    CORPORATION_WALLET_DIVISIONS,
  );
}
