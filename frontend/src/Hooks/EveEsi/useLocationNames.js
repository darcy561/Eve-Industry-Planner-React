import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import useUsersStore from "../../Zustand/usersStore";
import { locationNameQuery } from "../React Query/World/locationNames";
import { LOCATION_OUTCOME } from "../../Functions/EveESI/World/locationOutcome";
import { asNumberIDSet } from "../../Functions/Helper/ids";

const EMPTY_NAMES = {};

/**
 * Names for a set of locations, resolved once for the whole app.
 *
 * Each id is its own cache entry, so a name resolved for one view is present in the next without
 * being asked for again, and an id that could not be resolved is a failure against that id rather
 * than a hole in this view's set. The batching that keeps one entry per id from becoming one request
 * per id belongs to the loader beneath the query.
 *
 * `worldData` is read as well as written, because the surfaces that resolve nothing themselves read
 * their names from there and the older resolve-and-write path still fills it. A name the store
 * already holds is an answer, and is not asked for again.
 *
 * @param {Array<number>|Set<number>} [locationIds]
 * @returns {{names: Object<string, Object>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useLocationNames(locationIds) {
  const characters = useUsersStore((store) => store.account.characters);
  const universeIDs = useUsersStore((store) => store.worldData.universeIDs);
  const addUniverseIDs = useUsersStore(
    (store) => store.worldData.actions.addUniverseIDs,
  );

  const requested = useMemo(
    () => [...asNumberIDSet(locationIds)].sort((a, b) => a - b),
    [locationIds],
  );

  const missing = useMemo(
    () => requested.filter((id) => !universeIDs[id]),
    [requested, universeIDs],
  );

  const {
    names: fetched,
    isLoading,
    isError,
    error,
  } = useQueries({
    queries: missing.map((id) => locationNameQuery(id, characters ?? [])),
    combine: (results) => {
      const found = {};
      let pending = false;
      let failure = null;

      results.forEach((result, index) => {
        // An id ESI answered about and did not name is settled rather than missing — but it has no
        // name to show, and a consumer taking an entry for a named place would render a blank. It
        // stays in the cache and out of here.
        if (
          result.data &&
          result.data.resolutionStatus !== LOCATION_OUTCOME.UNNAMED
        ) {
          found[missing[index]] = result.data;
        }
        if (result.isLoading) pending = true;
        if (result.error && !failure) failure = result.error;
      });

      return {
        names: found,
        isLoading: pending,
        isError: Boolean(failure),
        error: failure ?? null,
      };
    },
  });

  useEffect(() => {
    if (Object.keys(fetched).length === 0) return;
    addUniverseIDs(fetched);
  }, [fetched, addUniverseIDs]);

  const names = useMemo(() => {
    const found = {};
    for (const id of requested) {
      const known = universeIDs[id] ?? fetched[id];
      if (known) found[id] = known;
    }
    return Object.keys(found).length > 0 ? found : EMPTY_NAMES;
  }, [requested, universeIDs, fetched]);

  return { names, isLoading, isError, error };
}
