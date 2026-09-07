import { useQuery } from "@tanstack/react-query";
import { fetchPlannersFromApi } from "../../Functions/Endpoints/Private/planners.js";
import useUsersStore from "../../Zustand/usersStore.js";

export const PLANNERS_QUERY_KEY = ["planners"];

/**
 * What to show for a planner the server has not named.
 *
 * @param {{owner: string, kind: string, name: string, named: boolean}} planner
 * @returns {string}
 */
export function plannerDisplayName(planner) {
  if (planner.name) return planner.name;

  if (planner.kind === "corporation") {
    const id = entityIDFromHandle(planner.owner);
    const corporation = useUsersStore
      .getState()
      .account.actions.getCorporation(id);
    if (corporation?.corporationName) return corporation.corporationName;
    return "Corporation";
  }
  if (planner.kind === "alliance") return "Alliance";
  return "My planner";
}

/**
 * The EVE id an owner handle names, or null for a kind that has none.
 *
 * @param {string} handle - `kind:id`
 * @returns {number|null}
 */
function entityIDFromHandle(handle) {
  const id = Number(handle.slice(handle.indexOf(":") + 1));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
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
