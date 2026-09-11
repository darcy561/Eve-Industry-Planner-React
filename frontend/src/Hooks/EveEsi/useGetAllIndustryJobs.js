import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import useUsersStore from "../../Zustand/usersStore";
import {
  characterIndustryJobsQuery,
  characterIndustryJobsQueryKey,
} from "../React Query/Character/industryJobs";
import {
  corporationIndustryJobsQuery,
  corporationIndustryJobsQueryKey,
} from "../React Query/Corporation/industryJobs";
import {
  isQueryObserverResultLoading,
  isQueryStateLoading,
} from "./queryLoadingState";

/**
 * Every industry job the account can see, character and corporation alike.
 *
 * A job installed by a tracked character into a corporation appears on both endpoints, so rows are
 * collapsed on `job_id`.
 *
 * @param {Array<Object>} jobs
 * @returns {Array<Object>}
 */
function uniqueByJobId(jobs) {
  const byJobId = new Map();
  for (const job of jobs) {
    if (!job || byJobId.has(job.job_id)) continue;
    byJobId.set(job.job_id, job);
  }
  return [...byJobId.values()];
}

/**
 * @param {Array<Object>} data
 * @param {boolean} isLoading
 * @param {Error|null} error
 */
function state(data, isLoading, error) {
  return { data, isLoading, isError: Boolean(error), error: error ?? null };
}

/**
 * The queries covering every character and every corporation the account tracks.
 *
 * Corporation jobs are keyed by corporation, so an account with several characters in one
 * corporation subscribes to that corporation once.
 *
 * @param {Array<Object>} characters
 * @param {Array<Object>} corporations
 * @returns {Array<Object>} React Query configuration objects
 */
function industryJobQueries(characters, corporations) {
  return [
    ...characters.map(({ CharacterHash }) =>
      characterIndustryJobsQuery(CharacterHash),
    ),
    ...corporations.map(({ corporation_id }) =>
      corporationIndustryJobsQuery(corporation_id),
    ),
  ];
}

/**
 * Reads every cached industry job without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {{data: Array<Object>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export function getCachedAllIndustryJobs(queryClient) {
  const { characters, corporations } = useUsersStore.getState().account;

  const keys = [
    ...(characters ?? []).map(({ CharacterHash }) => [
      characterIndustryJobsQueryKey,
      CharacterHash,
    ]),
    ...(corporations ?? []).map(({ corporation_id }) => [
      corporationIndustryJobsQueryKey,
      corporation_id,
    ]),
  ];

  const queryStates = keys.map((key) => ({
    queryState: queryClient.getQueryState(key),
    cachedData: queryClient.getQueryData(key),
  }));

  if (queryStates.some(({ queryState }) => isQueryStateLoading(queryState))) {
    return state([], true, null);
  }

  const error = queryStates.find(({ queryState }) => queryState?.error)
    ?.queryState?.error;

  if (error) {
    return state([], false, error);
  }

  return state(
    uniqueByJobId(
      queryStates.flatMap(({ cachedData }) => cachedData?.data ?? []),
    ),
    false,
    null,
  );
}

/**
 * Fetches every industry job the account can see.
 *
 * @returns {{data: Array<Object>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useGetAllIndustryJobs() {
  const characters = useUsersStore((store) => store.account.characters);
  const corporations = useUsersStore((store) => store.account.corporations);

  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;

    if (results.some(isQueryObserverResultLoading)) {
      return state([], true, null);
    }

    if (error) {
      return state([], false, error);
    }

    return state(
      uniqueByJobId(results.flatMap((result) => result.data?.data ?? [])),
      false,
      null,
    );
  }, []);

  return useQueries({
    queries: industryJobQueries(characters ?? [], corporations ?? []),
    combine,
  });
}
