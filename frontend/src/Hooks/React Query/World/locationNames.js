import { requestLocationName } from "../../../Functions/EveESI/World/locationNameLoader";
import { LOCATION_OUTCOME } from "../../../Functions/EveESI/World/locationOutcome";

export const LOCATION_NAME_QUERY_KEY = ["esi", "location-name"];

/**
 * One location's name, cached under that location's id.
 *
 * Keyed by the id and nothing else, which is the point: every view wanting a structure shares one
 * entry, so a name resolved on one page is present on the next, and an id that could not be
 * resolved is a failure on that id rather than a hole in some page's set. Keying by the set a page
 * happened to want is what let one page hold a cached gap the next page could not see.
 *
 * The characters are not part of the key. A location's name is a fact about the location; which of
 * the account's characters managed to read it is not something a consumer should have to match on.
 *
 * @param {number} locationId
 * @param {Array<Object>} characters - the account's characters, tried in order for a structure
 * @returns {object} React Query configuration
 */
export function locationNameQuery(locationId, characters = []) {
  return {
    queryKey: [...LOCATION_NAME_QUERY_KEY, locationId],
    queryFn: () => requestLocationName(locationId, characters),
    enabled: Boolean(locationId) && characters.length > 0,
    // A name does not change while the app is open, and every settled outcome — including a refusal
    // — is an answer worth keeping. A failure is not cached at all: it rejects, and is retried.
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };
}

/**
 * Names for a set of locations, fetched rather than subscribed.
 *
 * For the call sites that resolve names inside a flow they are already running — a match being
 * linked, an office being read — where a hook cannot be called. It shares the cache the hook
 * subscribes to, so a name fetched here is present for every view that later asks for it, and one
 * already held is not asked for again.
 *
 * An id that fails is left out rather than failing the set: these callers resolve names as a side
 * errand, and the flow they belong to should not stop because a name did not arrive. Nothing is
 * cached for it, so the next ask retries. An id that settled as `UNNAMED` is left out too — it is an
 * answer, but not a name to show — tested by its outcome rather than by whether it carries one, so a
 * future outcome with an empty name is not silently dropped with it.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {Array<number>|Set<number>} locationIds
 * @param {Array<Object>} characters
 * @returns {Promise<Object<string, Object>>} what was named, keyed by location id
 */
export async function fetchLocationNames(queryClient, locationIds, characters) {
  const ids = [...new Set([...(locationIds ?? [])].filter(Boolean))];
  if (ids.length === 0 || !(characters?.length > 0)) return {};

  const settled = await Promise.allSettled(
    ids.map((id) => queryClient.fetchQuery(locationNameQuery(id, characters))),
  );

  const names = {};
  settled.forEach((result, index) => {
    if (
      result.status === "fulfilled" &&
      result.value?.resolutionStatus !== LOCATION_OUTCOME.UNNAMED
    ) {
      names[ids[index]] = result.value;
    }
  });
  return names;
}
