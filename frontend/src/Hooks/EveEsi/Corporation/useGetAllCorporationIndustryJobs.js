import {
  corporationIndustryJobsQuery,
  corporationIndustryJobsQueryKey,
} from "../../React Query/Corporation/industryJobs";
import {
  readCorporationCollection,
  useCorporationCollection,
} from "./corporationCollection";

/**
 * Reads every tracked corporation's cached industry jobs without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function getAllCachedCorporationIndustryJobs(queryClient) {
  return readCorporationCollection(
    queryClient,
    corporationIndustryJobsQueryKey,
  );
}

/**
 * Fetches every tracked corporation's industry jobs, once per corporation.
 *
 * @returns {import("./corporationCollection").CorporationCollection}
 */
export function useGetAllCorporationIndustryJobs() {
  return useCorporationCollection(corporationIndustryJobsQuery);
}
