import { idsQueryKeySuffix } from "../idsQueryKey.js";
import getUniverseNames from "../../../Functions/EveESI/World/getUniverseNames";
import retryUnlessPermanent from "../retryUnlessPermanent";
import { asNumberIDSet } from "../../../Functions/Helper/ids";

export const ENTITY_NAMES_QUERY_KEY = ["esi", "entity-names"];

/**
 * The names behind a set of EVE ids.
 *
 * Ids are what the app works in and what a reader cannot check. A standing the
 * seller does not hold is the same message whichever empire it is against, so
 * without the name there is no way to tell a correct answer from a lookup
 * pointed at the wrong entity.
 *
 * Names do not change, so this is fetched once per set and held for the session.
 *
 * @param {Array<number|null>} ids
 * @returns {object} React Query configuration
 */
export function entityNamesQuery(ids) {
  const wanted = [...asNumberIDSet(ids)].sort((a, b) => a - b);

  return {
    queryKey: [...ENTITY_NAMES_QUERY_KEY, idsQueryKeySuffix(wanted)],
    // Keyed by id here rather than by every caller: ESI answers with a list, and
    // a lookup against a list silently finds nothing.
    queryFn: async () => {
      // Guarded here rather than by `enabled`: the one caller reaches this
      // through `fetchQuery`, which fetches whatever it is given and never
      // consults `enabled` at all.
      if (wanted.length === 0) return {};

      const named = await getUniverseNames(wanted);

      // Thrown rather than treated as no names. Names do not change, so this is
      // held for the session — and an answer the app could not read, quietly
      // turned into an empty one, would mean nothing resolves for these ids
      // until a reload. A rejected query is retried; a cached empty is not.
      if (!Array.isArray(named)) {
        throw new TypeError("universe names: expected a list of names");
      }

      return Object.fromEntries(named.map((entry) => [entry.id, entry]));
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: retryUnlessPermanent(1),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };
}
