import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import useUsersStore from "../../Zustand/usersStore";
import { characterAssetsQuery } from "../React Query/Character/assets";
import { corporationAssetsQuery } from "../React Query/Corporation/assets";
import buildAssetNodes from "../../Functions/Assets/buildAssetNodes";
import createCollectionCache from "../../Functions/Shared/collectionCache";
import {
  isQueryObserverResultLoading,
  isQueryStateLoading,
} from "./queryLoadingState";

/**
 * Scopes an asset collection can be asked for.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ASSET_SCOPE = Object.freeze({
  CHARACTER: "character",
  CHARACTERS: "characters",
  CORPORATION: "corporation",
});

const EMPTY_COLLECTION = buildAssetNodes([]);

const deriveNodes = createCollectionCache(
  (sources) => buildAssetNodes(sources.flat()),
  EMPTY_COLLECTION
);

/**
 * Builds the queries a scope subscribes to.
 *
 * A corporation's rows stay fanned out over its members: ESI returns only what each character's
 * roles reveal, so the corporation's set is the union of its members' views and must be built from
 * the merged rows — a container one member can see may hold contents only another can.
 *
 * @param {string} scope
 * @param {string|number|undefined} id
 * @param {Array<Object>} characters
 * @param {Array<Object>} corporations
 * @returns {Array<Object>} React Query configuration objects
 */
function queriesForScope(scope, id, characters, corporations) {
  switch (scope) {
    case ASSET_SCOPE.CHARACTER:
      return id ? [characterAssetsQuery(id)] : [];

    case ASSET_SCOPE.CHARACTERS:
      return characters.map(({ CharacterHash }) =>
        characterAssetsQuery(CharacterHash)
      );

    case ASSET_SCOPE.CORPORATION: {
      const corporation = corporations.find(
        (c) => Number(c.corporation_id) === Number(id)
      );
      return (corporation?.members ?? []).map((memberHash) =>
        corporationAssetsQuery(memberHash)
      );
    }

    default:
      return [];
  }
}

/**
 * The same collection, read from the cache without subscribing.
 *
 * For the consumers that resolve assets inside an effect with a query client rather than through a
 * subscription. It shares the builder and the cache with {@link useAssetIndex}, so the two cannot
 * hand back different readings of one set of rows.
 *
 * @param {Object} queryClient - React Query client instance
 * @param {{scope: string, id?: string|number}} [request]
 * @returns {import("../../Functions/Assets/buildAssetNodes").AssetCollection}
 */
export function getCachedAssetIndex(queryClient, { scope, id } = {}) {
  const { characters, corporations } = useUsersStore.getState().account;

  const keys = queriesForScope(
    scope,
    id,
    characters ?? [],
    corporations ?? []
  ).map((query) => query.queryKey);

  const sources = [];

  for (const key of keys) {
    const state = queryClient.getQueryState(key);

    // Still arriving, or failed over rows fetched earlier, is not an answer — the same reading the
    // hook gives, so a consumer moved between the two sees no difference.
    if (isQueryStateLoading(state) || state?.error) {
      return EMPTY_COLLECTION;
    }

    const rows = queryClient.getQueryData(key);
    if (Array.isArray(rows)) sources.push(rows);
  }

  return deriveNodes(sources);
}

/**
 * One normalised asset collection for a scope, shared by every consumer that asks for it.
 *
 * @param {{scope: string, id?: string|number}} request
 * @returns {{data: import("../../Functions/Assets/buildAssetNodes").AssetCollection, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useAssetIndex({ scope, id } = {}) {
  const characters = useUsersStore((state) => state.account.characters);
  const corporations = useUsersStore((state) => state.account.corporations);

  // Only the raw sources and the flags come back through `combine`. React Query structurally
  // shares whatever it returns, which would clone the derived collection and hand each consumer
  // its own copy; the source arrays survive that untouched, so the shared cache still hits.
  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;
    return {
      sources: results
        .map((result) => result.data)
        .filter((rows) => Array.isArray(rows)),
      isLoading: results.some(isQueryObserverResultLoading),
      isError: Boolean(error),
      error,
    };
  }, []);

  const { sources, isLoading, isError, error } = useQueries({
    queries: queriesForScope(scope, id, characters ?? [], corporations ?? []),
    combine,
  });

  return {
    data: isLoading || isError ? EMPTY_COLLECTION : deriveNodes(sources),
    isLoading,
    isError,
    error,
  };
}
