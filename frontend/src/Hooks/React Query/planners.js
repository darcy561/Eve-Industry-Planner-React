import { useQuery } from "@tanstack/react-query";
import { fetchPlannersFromApi } from "../../Functions/Endpoints/Private/planners.js";
import useUsersStore from "../../Zustand/usersStore.js";

export const PLANNERS_QUERY_KEY = ["planners"];

/**
 * What to show for a planner the server has not named.
 *
 * Membership is what grants access, so an account reaches every corporation it is
 * in before any of them has a planner document. The client already knows what
 * those entities are called — it built a corporation object for each at login —
 * so it names them itself rather than the listing inventing one, and the server
 * writes the real name when the planner is opened.
 *
 * @param {{owner: string, kind: string, name: string, named: boolean}} planner
 * @returns {string}
 */
export function plannerDisplayName(planner) {
  if (planner.name) return planner.name;

  if (planner.kind === "corporation") {
    const corporation = corporationForOwner(planner.owner);
    if (corporation?.corporationName) return corporation.corporationName;
    return "Corporation";
  }
  if (planner.kind === "alliance") return "Alliance";
  return "My planner";
}

/**
 * The corporation an owner handle addresses, if this account holds one.
 *
 * The handle carries a ref rather than an EVE id, and the client stores
 * corporations by id — so this matches on the ref the account's own characters
 * produced rather than decoding anything.
 */
function corporationForOwner(owner) {
  const { corporations, characters } = useUsersStore.getState().account;
  if (!corporations?.length) return null;

  // Only one corporation can be the account's, and a listing entry names a
  // planner the account is a member of, so the character's corporation is the
  // one being named whenever there is exactly one candidate.
  const ids = new Set(
    (characters ?? []).map((character) => character.corporation_id).filter(Boolean)
  );
  const candidates = corporations.filter((corporation) =>
    ids.has(corporation.corporation_id)
  );
  return candidates.length === 1 ? candidates[0] : null;
}

/** Base options for the planners listing. */
export function plannersQueryOptions() {
  return {
    queryKey: PLANNERS_QUERY_KEY,
    queryFn: fetchPlannersFromApi,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  };
}

/**
 * Every planner the account may work in, with a name to show for each.
 *
 * @param {{enabled?: boolean}} [options]
 */
export function usePlannersQuery({ enabled = true } = {}) {
  const isLoggedIn = useUsersStore((state) => state.account.isLoggedIn);
  return useQuery({
    ...plannersQueryOptions(),
    enabled: enabled && isLoggedIn,
  });
}
