import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import useUsersStore from "../../Zustand/usersStore";
import resolveLocationNames from "../../Functions/EveESI/World/resolveLocationNames";

export const locationNamesQueryKey = "locationNames";

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

  // Only what the store is missing reaches the query, so a second consumer asking for the same
  // locations resolves nothing and the request is shared through the store rather than repeated.
  const missing = useMemo(
    () => requested.filter((id) => !universeIDs[id]).sort((a, b) => a - b),
    [requested, universeIDs]
  );

  const { isLoading, isError, error } = useQuery({
    queryKey: [locationNamesQueryKey, missing.join(",")],
    queryFn: () => resolveLocationNames(missing, characters),
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
