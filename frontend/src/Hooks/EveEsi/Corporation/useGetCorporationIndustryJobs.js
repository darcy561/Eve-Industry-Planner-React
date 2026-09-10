import { useQuery } from "@tanstack/react-query";
import {
  corporationIndustryJobsQuery,
  corporationIndustryJobsQueryKey,
} from "../../React Query/Corporation/industryJobs";
import { isQueryStateLoading } from "../queryLoadingState";

/**
 * Subscribes to one corporation's industry jobs.
 *
 * @param {number|string} corporationId
 * @returns {Object} React Query result
 */
export function useGetCorporationIndustryJobs(corporationId) {
  return useQuery(corporationIndustryJobsQuery(corporationId));
}

/**
 * Reads one corporation's cached industry jobs without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @param {number|string} corporationId
 * @returns {{data: Array<Object>, isLoading: boolean, isError: boolean|Error}}
 */
export function getCachedCorporationIndustryJobs(queryClient, corporationId) {
  const queryKey = [corporationIndustryJobsQueryKey, corporationId];
  const queryState = queryClient.getQueryState(queryKey);

  if (isQueryStateLoading(queryState)) {
    return { data: [], isLoading: true, isError: false };
  }

  if (queryState?.error) {
    return { data: [], isLoading: false, isError: queryState.error };
  }

  return {
    data: queryClient.getQueryData(queryKey)?.data ?? [],
    isLoading: false,
    isError: false,
  };
}
