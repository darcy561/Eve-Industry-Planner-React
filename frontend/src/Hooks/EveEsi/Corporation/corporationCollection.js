import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import useUsersStore from "../../../Zustand/usersStore";
import {
  isQueryObserverResultLoading,
  isQueryStateLoading,
} from "../queryLoadingState";

/**
 * The shape every corporation collection hands its consumers.
 *
 * @typedef {Object} CorporationCollection
 * @property {Object<string, Array<Object>>} data - rows keyed by corporation id
 * @property {boolean} isLoading
 * @property {boolean} isError
 * @property {Error|null} error
 */

/**
 * @param {Object<string, Array<Object>>} data
 * @param {boolean} isLoading
 * @param {Error|null} error
 * @returns {CorporationCollection}
 */
function state(data, isLoading, error) {
  return { data, isLoading, isError: Boolean(error), error: error ?? null };
}

/**
 * Keys each payload's rows by its corporation.
 *
 * One query per corporation, so a corporation appears once and its rows arrive once. Repeats would
 * mean the collection had been fetched per character again, so nothing is deduplicated here.
 *
 * @param {Array<{data?: Array<Object>, corporation_id?: number}|undefined>} payloads
 * @returns {Object<string, Array<Object>>}
 */
export function keyRowsByCorporation(payloads) {
  const byCorporation = {};

  for (const payload of payloads) {
    if (!payload?.corporation_id) continue;
    const held = byCorporation[payload.corporation_id];
    byCorporation[payload.corporation_id] = held
      ? held.concat(payload.data ?? [])
      : payload.data ?? [];
  }

  return byCorporation;
}

/**
 * Every tracked corporation, or an empty list before the account has loaded.
 *
 * @returns {Array<Object>}
 */
function trackedCorporations() {
  return useUsersStore.getState().account.corporations ?? [];
}

/**
 * Reads a corporation collection from the cache without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @param {string} queryKeyRoot
 * @param {number[]} [divisions] - when the collection is keyed per wallet division
 * @returns {CorporationCollection}
 */
export function readCorporationCollection(queryClient, queryKeyRoot, divisions) {
  const keys = trackedCorporations().flatMap(({ corporation_id }) =>
    divisions
      ? divisions.map((division) => [queryKeyRoot, corporation_id, division])
      : [[queryKeyRoot, corporation_id]]
  );

  const queryStates = keys.map((key) => ({
    queryState: queryClient.getQueryState(key),
    cachedData: queryClient.getQueryData(key),
  }));

  if (queryStates.some(({ queryState }) => isQueryStateLoading(queryState))) {
    return state({}, true, null);
  }

  const error = queryStates.find(({ queryState }) => queryState?.error)
    ?.queryState?.error;

  if (error) {
    return state({}, false, error);
  }

  return state(
    keyRowsByCorporation(queryStates.map(({ cachedData }) => cachedData)),
    false,
    null
  );
}

/**
 * Subscribes to a corporation collection across every tracked corporation.
 *
 * @param {Function} queryFactory - takes a corporation id, and a division when one is given
 * @param {number[]} [divisions] - when the collection is keyed per wallet division
 * @returns {CorporationCollection}
 */
export function useCorporationCollection(queryFactory, divisions) {
  const corporations = useUsersStore((store) => store.account.corporations);

  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;

    if (results.some(isQueryObserverResultLoading)) {
      return state({}, true, null);
    }

    if (error) {
      return state({}, false, error);
    }

    return state(
      keyRowsByCorporation(results.map((result) => result.data)),
      false,
      null
    );
  }, []);

  return useQueries({
    queries: (corporations ?? []).flatMap(({ corporation_id }) =>
      divisions
        ? divisions.map((division) => queryFactory(corporation_id, division))
        : [queryFactory(corporation_id)]
    ),
    combine,
  });
}
