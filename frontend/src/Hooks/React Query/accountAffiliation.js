import { useQuery } from "@tanstack/react-query";
import useUsersStore from "../../Zustand/usersStore";
import refreshAccountSessionGrants from "../../Functions/Auth/refreshAccountSessionGrants";
import GLOBAL_CONFIG from "../../global-config-app";

export const ACCOUNT_AFFILIATION_QUERY_KEY = ["account", "affiliation"];

const REFRESH_MS =
  Math.max(1, Number(GLOBAL_CONFIG.ACCOUNT_AFFILIATION_REFRESH_MINUTES) || 15) * 60 * 1000;

/**
 * Re-reads each character's public data and resubmits ESI tokens for session grants.
 *
 * Characters are only rewritten into the store when a corporation actually changed: the roster is
 * subscribed to widely, and a periodic no-op write would re-render every one of those consumers.
 *
 * @returns {Promise<{checkedAt: number, corporationsChanged: number}>}
 */
async function refreshAccountAffiliation() {
  const { characters, actions } = useUsersStore.getState().account;
  const live = characters.filter((c) => c && !c.isPlaceholder);

  const before = new Map(live.map((c) => [c.CharacterHash, c.corporation_id]));
  await Promise.allSettled(live.map((character) => character.getPublicCharacterData()));
  const corporationsChanged = live.filter(
    (c) => before.get(c.CharacterHash) !== c.corporation_id
  ).length;

  if (corporationsChanged > 0) {
    actions.updateCharacters([...useUsersStore.getState().account.characters]);
  }

  await refreshAccountSessionGrants();
  return { checkedAt: Date.now(), corporationsChanged };
}

export function accountAffiliationQueryOptions() {
  return {
    queryKey: ACCOUNT_AFFILIATION_QUERY_KEY,
    queryFn: refreshAccountAffiliation,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  };
}

/** App-level: keeps character affiliation and account session grants current while the app is open. */
export function useAccountAffiliationQuery() {
  const isLoggedIn = useUsersStore((s) => s.account.isLoggedIn);
  const plannerPrivateAuthReady = useUsersStore((s) => s.account.plannerPrivateAuthReady);

  return useQuery({
    ...accountAffiliationQueryOptions(),
    enabled: isLoggedIn && plannerPrivateAuthReady,
  });
}
