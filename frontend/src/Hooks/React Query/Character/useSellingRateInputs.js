import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";

import { characterSkillsQuery } from "./skills";
import { characterStandingsQuery } from "./standings";
import { isQueryObserverResultLoading } from "../../EveEsi/queryLoadingState";

/**
 * The two reads every broker fee and sales tax is worked out from, subscribed
 * for a set of characters.
 *
 * `sellingRates` reads skills and standings through their cached accessors,
 * which never start a fetch. Whatever needs a fee therefore has to subscribe
 * first, and the two stages had different ideas about who to subscribe for:
 * Planning quoted one seller, while Selling subscribed for the account's main
 * and then worked each order's fee out against the character who placed it — so
 * an order from an alt was costed against a cache nobody had filled, and the fee
 * is stored on the job rather than re-derived later.
 *
 * @param {string[]|string} characterHashes
 * @returns {{isLoading: boolean, isError: boolean, error: Error|null, updatedAt: number}}
 */
export function useSellingRateInputs(characterHashes) {
  const hashes = [
    ...new Set(
      (Array.isArray(characterHashes)
        ? characterHashes
        : [characterHashes]
      ).filter(Boolean),
    ),
  ];

  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;

    return {
      isLoading: results.some(isQueryObserverResultLoading),
      isError: Boolean(error),
      error,
      // What the cached accessors would return, as one number. A caller keying a
      // derived query on this recomputes when either read lands, rather than
      // caching a figure worked out before they arrived.
      updatedAt: results.reduce(
        (latest, result) => Math.max(latest, result.dataUpdatedAt ?? 0),
        0,
      ),
    };
  }, []);

  return useQueries({
    queries: hashes.flatMap((hash) => [
      characterSkillsQuery(hash),
      characterStandingsQuery(hash),
    ]),
    combine,
  });
}

/**
 * Puts the same two reads in the cache for one character, fetching them if they
 * are not there.
 *
 * The subscription above keeps a panel current for characters it knows about,
 * but a fee is worked out and **stored** the moment an order is linked, and the
 * orders offered for linking come from every character on the account — not only
 * the ones with orders already linked. A figure that goes onto the job cannot
 * depend on some other component having subscribed first.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {string|null} characterHash
 * @returns {Promise<void>}
 */
export async function ensureSellingRateInputs(queryClient, characterHash) {
  if (!characterHash) return;

  await Promise.all([
    queryClient.ensureQueryData(characterSkillsQuery(characterHash)),
    queryClient.ensureQueryData(characterStandingsQuery(characterHash)),
  ]);
}
