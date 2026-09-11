import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import getMarketData from "../../../Functions/MarketData/findMarketData";
import useUsersStore from "../../../Zustand/usersStore";
import { idsQueryKeySuffix } from "../idsQueryKey.js";

export const MARKET_PRICES_QUERY_KEY = ["market", "prices"];

/**
 * Prices for a set of type ids, kept in the world data store the way every other
 * price fetch in the SPA keeps them.
 *
 * `getMarketData` already asks only for the ids whose stored price is missing or
 * past its refresh window, so this asks it again on every mount rather than
 * inheriting the app's stale time, and a failed fetch is not retried — the views
 * that use this draw without prices rather than waiting behind a retry.
 *
 * @param {Iterable<string|number>} typeIDs - Ids to price.
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true]
 * @returns {{isLoading: boolean, isError: boolean, error: Error|null}}
 */
export function useMarketPricesQuery(typeIDs, { enabled = true } = {}) {
  const wanted = useMemo(() => idsQueryKeySuffix(typeIDs), [typeIDs]);

  const { isLoading, isError, error } = useQuery({
    queryKey: [...MARKET_PRICES_QUERY_KEY, wanted],
    queryFn: async () => {
      const prices = await getMarketData(new Set(wanted.split(",")));
      useUsersStore.getState().worldData.actions.addMarketData(prices);
      return prices;
    },
    enabled: enabled && wanted.length > 0,
    staleTime: 0,
    retry: false,
  });

  return { isLoading, isError, error };
}
