import { useQueries } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import useUsersStore from "../../Zustand/usersStore";
import { characterAssetsQuery } from "../React Query/Character/assets";
import { corporationAssetsQuery } from "../React Query/Corporation/assets";
import buildAssetNodes, {
  ASSET_OWNER_KIND,
  buildAssetCollection,
} from "../../Functions/Assets/buildAssetNodes";
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
  ALL: "all",
});

const EMPTY_COLLECTION = buildAssetNodes([]);

/**
 * Owners travel into the shared cache as one string.
 *
 * The cache compares its second argument by identity, so an array rebuilt each render would miss
 * every time and each consumer would derive its own copy of the collection.
 */
const OWNER_SEPARATOR = "\n";
const ownersKey = (owners) =>
  owners.map((owner) => `${owner.kind}:${owner.id}`).join(OWNER_SEPARATOR);

const readOwners = (key) =>
  key.split(OWNER_SEPARATOR).map((entry) => {
    const separator = entry.indexOf(":");
    return { kind: entry.slice(0, separator), id: entry.slice(separator + 1) };
  });

const deriveNodes = createCollectionCache(
  (sources, key) => buildAssetCollection(sources, readOwners(key)),
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
 * Each query carries the owner its rows belong to, because nothing on the rows themselves says.
 *
 * @returns {Array<Object>} React Query configuration objects, each with an `owner`
 */
function queriesForScope(scope, id, characters, corporations) {
  const held = (query, kind, ownerId) => ({
    ...query,
    owner: { kind, id: ownerId },
  });

  const everyCharacter = () =>
    characters.map(({ CharacterHash }) =>
      held(
        characterAssetsQuery(CharacterHash),
        ASSET_OWNER_KIND.CHARACTER,
        CharacterHash
      )
    );

  const corporationQueries = (corporation) =>
    (corporation?.members ?? []).map((memberHash) =>
      held(
        corporationAssetsQuery(memberHash),
        ASSET_OWNER_KIND.CORPORATION,
        corporation.corporation_id
      )
    );

  switch (scope) {
    case ASSET_SCOPE.CHARACTER:
      return id
        ? [held(characterAssetsQuery(id), ASSET_OWNER_KIND.CHARACTER, id)]
        : [];

    case ASSET_SCOPE.CHARACTERS:
      return everyCharacter();

    case ASSET_SCOPE.CORPORATION:
      return corporationQueries(
        corporations.find((c) => Number(c.corporation_id) === Number(id))
      );

    case ASSET_SCOPE.ALL:
      return [
        ...everyCharacter(),
        ...corporations.flatMap(corporationQueries),
      ];

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

  const queries = queriesForScope(scope, id, characters ?? [], corporations ?? []);

  const sources = [];
  const owners = [];

  for (const query of queries) {
    const state = queryClient.getQueryState(query.queryKey);

    // Still arriving, or failed over rows fetched earlier, is not an answer — the same reading the
    // hook gives, so a consumer moved between the two sees no difference.
    if (isQueryStateLoading(state) || state?.error) {
      return EMPTY_COLLECTION;
    }

    const rows = queryClient.getQueryData(query.queryKey);
    if (!Array.isArray(rows)) continue;

    sources.push(rows);
    owners.push(query.owner);
  }

  return deriveNodes(sources, ownersKey(owners));
}

/**
 * One normalised asset collection for a scope, shared by every consumer that asks for it.
 *
 * @param {{scope: string, id?: string|number, enabled?: boolean}} request
 * @returns {{data: import("../../Functions/Assets/buildAssetNodes").AssetCollection, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useAssetIndex({ scope, id, enabled = true } = {}) {
  const characters = useUsersStore((state) => state.account.characters);
  const corporations = useUsersStore((state) => state.account.corporations);

  const queries = useMemo(
    () => queriesForScope(scope, id, characters ?? [], corporations ?? []),
    [scope, id, characters, corporations]
  );
  const owners = useMemo(() => queries.map((query) => query.owner), [queries]);

  // Only the raw sources and the flags come back through `combine`. React Query structurally
  // shares whatever it returns, which would clone the derived collection and hand each consumer
  // its own copy; the source arrays survive that untouched, so the shared cache still hits.
  //
  // Owners are paired here rather than outside, because a query with nothing yet contributes no
  // source and the two lists have to stay aligned.
  const combine = useCallback(
    (results) => {
      const error = results.find((result) => result.error)?.error ?? null;
      const sources = [];
      const present = [];

      results.forEach((result, index) => {
        if (!Array.isArray(result.data)) return;
        sources.push(result.data);
        present.push(owners[index]);
      });

      return {
        sources,
        owners: ownersKey(present),
        isLoading: results.some(isQueryObserverResultLoading),
        isError: Boolean(error),
        error,
      };
    },
    [owners]
  );

  const { sources, owners: key, isLoading, isError, error } = useQueries({
    // `owner` is ours, not React Query's, so it does not travel into the query configuration.
    queries: queries.map(({ owner, ...query }) => ({
      ...query,
      enabled: enabled && query.enabled !== false,
    })),
    combine,
  });

  return {
    data: isLoading || isError ? EMPTY_COLLECTION : deriveNodes(sources, key),
    isLoading,
    isError,
    error,
  };
}
