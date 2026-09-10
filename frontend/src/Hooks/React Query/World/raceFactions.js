import getRaces from "../../../Functions/EveESI/World/getRaces";

export const RACE_FACTIONS_QUERY_KEY = ["esi", "race-factions"];

/**
 * Which faction each race belongs to, as a map from race id to faction id.
 *
 * A station names the race that built it and never the faction, but standings
 * are held against the faction: Jita 4-4 reports `race_id: 1` while the standing
 * that reduces its broker fee is against Caldari State, 500001. Looking a
 * standing up by the race id finds nothing and quotes every seller as unknown to
 * the empire whose station they are listing in.
 *
 * Races change with an expansion rather than with play, so this is fetched once
 * and held for the session. It takes no character and spends no character rate
 * limit, which is why it carries no `enabled` guard: a signed-out reader still
 * needs the map to be told what a fee would be.
 *
 * @returns {object} React Query configuration
 */
export function raceFactionsQuery() {
  return {
    queryKey: RACE_FACTIONS_QUERY_KEY,
    queryFn: async () => {
      const races = await getRaces();

      return new Map(
        races
          .filter((race) => race?.race_id != null && race?.alliance_id != null)
          .map((race) => [race.race_id, race.alliance_id]),
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };
}
