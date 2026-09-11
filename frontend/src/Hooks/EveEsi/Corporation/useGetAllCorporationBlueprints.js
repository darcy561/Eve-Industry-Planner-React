import { useQueries } from "@tanstack/react-query";
import useUsersStore from "../../../Zustand/usersStore";
import { useCallback } from "react";
import {
  corporationBlueprintsQuery,
  corporationBlueprintsQueryKey,
} from "../../React Query/Corporation/blueprints";
import {
  isQueryObserverResultLoading,
  isQueryStateLoading,
} from "../queryLoadingState";

function findFirstError(results) {
  return results.find((result) => result.error)?.error;
}

function createErrorObject(error) {
  return {
    data: {},
    isLoading: false,
    isError: error !== null,
    error,
  };
}

function createLoadingObject() {
  return {
    data: {},
    isLoading: true,
    isError: false,
    error: null,
  };
}

function createSuccessObject(data) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
  };
}

/**
 * Keys each corporation's rows by its id.
 *
 * One query per corporation, so a corporation appears once and its rows arrive once. No
 * deduplication is needed or wanted here — repeats would mean the list had been fetched per
 * character again.
 *
 * @param {Array<{data?: Array<Object>, corporation_id?: number}|undefined>} payloads
 * @returns {Object<string, Array<Object>>}
 */
function keyBlueprintsByCorporation(payloads) {
  const byCorporation = {};

  for (const payload of payloads) {
    if (!payload?.corporation_id) continue;
    byCorporation[payload.corporation_id] = payload.data ?? [];
  }

  return byCorporation;
}

/**
 * Reads every tracked corporation's cached blueprints without triggering a fetch.
 *
 * @param {Object} queryClient - React Query client instance
 * @returns {{data: Object<string, Array<Object>>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export function getAllCachedCorporationBlueprints(queryClient) {
  const { corporations } = useUsersStore.getState().account;

  const queryStates = (corporations ?? []).map(({ corporation_id }) => {
    const queryKey = [corporationBlueprintsQueryKey, corporation_id];
    return {
      queryState: queryClient.getQueryState(queryKey),
      cachedData: queryClient.getQueryData(queryKey),
    };
  });

  const isLoading = queryStates.some(({ queryState }) =>
    isQueryStateLoading(queryState),
  );

  if (isLoading) {
    return createLoadingObject();
  }

  const error = queryStates.find(({ queryState }) => queryState?.error)
    ?.queryState?.error;

  if (error) {
    return createErrorObject(error);
  }

  return createSuccessObject(
    keyBlueprintsByCorporation(queryStates.map(({ cachedData }) => cachedData)),
  );
}

/**
 * Fetches every tracked corporation's blueprints, once per corporation.
 *
 * @returns {{data: Object<string, Array<Object>>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export function useGetAllCorporationBlueprints() {
  const corporations = useUsersStore((state) => state.account.corporations);

  const combineFunction = useCallback((results) => {
    const isLoading = results.some(isQueryObserverResultLoading);
    const error = findFirstError(results);

    if (isLoading) {
      return createLoadingObject();
    }

    if (error) {
      return createErrorObject(error);
    }

    return createSuccessObject(
      keyBlueprintsByCorporation(results.map((result) => result.data)),
    );
  }, []);

  return useQueries({
    queries: (corporations ?? []).map(({ corporation_id }) =>
      corporationBlueprintsQuery(corporation_id),
    ),
    combine: combineFunction,
  });
}
