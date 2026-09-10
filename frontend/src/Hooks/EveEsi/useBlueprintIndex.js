import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import useUsersStore from "../../Zustand/usersStore";
import { characterBlueprintsQuery } from "../React Query/Character/blueprints";
import { corporationBlueprintsQuery } from "../React Query/Corporation/blueprints";
import buildBlueprintRows from "../../Functions/Blueprints/buildBlueprintRows";
import createCollectionCache from "../../Functions/Shared/collectionCache";
import { useCachedData } from "../App/useCachedData";
import { CACHED_DATA_FILES } from "../../Context/defaultValues";
import { isQueryObserverResultLoading } from "./queryLoadingState";

/**
 * Scopes a blueprint collection can be asked for.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const BLUEPRINT_SCOPE = Object.freeze({
  CHARACTER: "character",
  CHARACTERS: "characters",
  CORPORATION: "corporation",
  ALL: "all",
});

const EMPTY_COLLECTION = buildBlueprintRows([], []);

const deriveRows = createCollectionCache(
  (sources, searchIndex) => buildBlueprintRows(sources.flat(), searchIndex),
  EMPTY_COLLECTION
);

/**
 * Builds the queries a scope subscribes to.
 *
 * Corporation rows are keyed by corporation rather than by member: ESI returns the whole list to
 * any member holding the role, so one query serves them all.
 *
 * @param {string} scope
 * @param {string|number|undefined} id
 * @param {Array<Object>} characters
 * @param {Array<Object>} corporations
 * @returns {Array<Object>} React Query configuration objects
 */
function queriesForScope(scope, id, characters, corporations) {
  const everyCharacter = () =>
    characters.map(({ CharacterHash }) => characterBlueprintsQuery(CharacterHash));
  const everyCorporation = () =>
    corporations.map(({ corporation_id }) =>
      corporationBlueprintsQuery(corporation_id)
    );

  switch (scope) {
    case BLUEPRINT_SCOPE.CHARACTER:
      return id ? [characterBlueprintsQuery(id)] : [];

    case BLUEPRINT_SCOPE.CHARACTERS:
      return everyCharacter();

    case BLUEPRINT_SCOPE.CORPORATION:
      return id ? [corporationBlueprintsQuery(id)] : [];

    case BLUEPRINT_SCOPE.ALL:
      return [...everyCharacter(), ...everyCorporation()];

    default:
      return [];
  }
}

/**
 * One normalised blueprint collection for a scope, shared by every consumer that asks for it.
 *
 * @param {{scope: string, id?: string|number}} request
 * @returns {{data: import("../../Functions/Blueprints/buildBlueprintRows").BlueprintCollection, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useBlueprintIndex({ scope, id } = {}) {
  const characters = useUsersStore((state) => state.account.characters);
  const corporations = useUsersStore((state) => state.account.corporations);
  const {
    data: searchIndex,
    isLoading: searchIndexLoading,
    error: searchIndexError,
  } = useCachedData(CACHED_DATA_FILES.SEARCH_INDEX);

  // Only the raw sources and the flags come back through `combine`. React Query structurally
  // shares whatever it returns, which would clone the derived collection and hand each consumer
  // its own copy; the source arrays survive that untouched, so the shared cache still hits.
  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;
    return {
      // Both query shapes wrap their rows — { data, characterHash } and { data, corporation_id }.
      sources: results
        .map((result) => result.data?.data)
        .filter((rows) => Array.isArray(rows)),
      isLoading: results.some(isQueryObserverResultLoading),
      isError: Boolean(error),
      error,
    };
  }, []);

  const queryState = useQueries({
    queries: queriesForScope(scope, id, characters ?? [], corporations ?? []),
    combine,
  });

  const isLoading = searchIndexLoading || queryState.isLoading;
  const error = searchIndexError ?? queryState.error ?? null;
  const isError = Boolean(error);

  return {
    data:
      isLoading || isError
        ? EMPTY_COLLECTION
        : deriveRows(queryState.sources, searchIndex),
    isLoading,
    isError,
    error,
  };
}
