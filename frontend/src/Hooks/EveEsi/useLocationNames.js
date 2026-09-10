import { useQuery } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore } from "react";
import useUsersStore from "../../Zustand/usersStore";
import resolveLocationNames from "../../Functions/EveESI/World/resolveLocationNames";

export const locationNamesQueryKey = "locationNames";

/**
 * Ids a resolution is already running for, anywhere in the app.
 *
 * The set of ids a caller wants grows as its collection arrives, and each growth is a new query key.
 * Without this the new query asks again for everything the running one has not finished, so the same
 * structures are resolved several times over and each round competes with the fetches it is waiting
 * on.
 *
 * @type {Set<number>}
 */
const beingResolved = new Set();

const released = { version: 0, listeners: new Set() };

function subscribeToReleases(listener) {
  released.listeners.add(listener);
  return () => released.listeners.delete(listener);
}

/**
 * Releasing is announced; claiming is not.
 *
 * A consumer that stood aside for a running resolution has nothing else to tell it the claim was
 * dropped: a resolution that fails writes nothing, so neither the store nor the ids it wanted
 * change, and it would wait for the rest of the session. Claiming stays silent so that the consumer
 * doing the resolving does not see its own ids disappear from under its running query.
 *
 * @param {number[]} ids
 */
function releaseClaims(ids) {
  for (const id of ids) beingResolved.delete(id);
  released.version += 1;
  for (const listener of released.listeners) listener();
}

/**
 * Names for a set of locations, resolved once for the whole app.
 *
 * Seven places used to run this themselves inside the effect that built their view, so a page that
 * only counted quantities still waited on a station-name round trip, and each held its own idea of
 * what had already been resolved. The names live in `worldData`; this is the one thing that fills
 * it, and a consumer that does not render a location simply does not call it.
 *
 * @param {Array<number>|Set<number>} [locationIds]
 * @returns {{names: Object<string, Object>, isLoading: boolean, isError: boolean, error: Error|null}}
 */
export default function useLocationNames(locationIds) {
  const characters = useUsersStore((store) => store.account.characters);
  const universeIDs = useUsersStore((store) => store.worldData.universeIDs);

  const requested = useMemo(
    () => [...(locationIds ?? [])].filter(Boolean),
    [locationIds]
  );
  const claimsReleased = useSyncExternalStore(
    subscribeToReleases,
    () => released.version
  );

  // Only what the store is missing and nothing else is already resolving reaches the query, so a
  // second consumer asking for the same locations waits on the store rather than asking again.
  const missing = useMemo(
    () =>
      requested
        .filter((id) => !universeIDs[id] && !beingResolved.has(id))
        .sort((a, b) => a - b),
    // A release is what makes an id another consumer stood aside for worth asking for again.
    [requested, universeIDs, claimsReleased]
  );

  const { isLoading, isError, error } = useQuery({
    queryKey: [locationNamesQueryKey, missing.join(",")],
    queryFn: async () => {
      for (const id of missing) beingResolved.add(id);
      try {
        return await resolveLocationNames(missing, characters);
      } finally {
        releaseClaims(missing);
      }
    },
    enabled: missing.length > 0 && (characters?.length ?? 0) > 0,
    // A location's name does not change while the app is open, and the store keeps what was
    // resolved, so there is nothing for a refetch to discover.
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const names = useMemo(() => {
    const found = {};
    for (const id of requested) {
      if (universeIDs[id]) found[id] = universeIDs[id];
    }
    return found;
  }, [requested, universeIDs]);

  return { names, isLoading, isError, error: error ?? null };
}
