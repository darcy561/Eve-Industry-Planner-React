import { useQueries } from "@tanstack/react-query";
import { useCallback } from "react";
import useUsersStore from "../../Zustand/usersStore";
import { characterJournalQuery } from "../React Query/Character/journal";
import { characterTransactionsQuery } from "../React Query/Character/transactions";
import { characterMarketOrdersQuery } from "../React Query/Character/marketOrders";
import { characterHistoricMarketOrdersQuery } from "../React Query/Character/historicMarketOrders";
import { corporationMarketOrdersQuery } from "../React Query/Corporation/marketOrders";
import { corporationHistoricMarketOrdersQuery } from "../React Query/Corporation/historicMarketOrders";
import {
  corporationJournalQuery,
  CORPORATION_WALLET_DIVISIONS,
} from "../React Query/Corporation/journal";
import { corporationTransactionsQuery } from "../React Query/Corporation/transactions";
import { isQueryObserverResultLoading } from "./queryLoadingState";

const CHARACTER_QUERIES = [
  characterMarketOrdersQuery,
  characterHistoricMarketOrdersQuery,
  characterTransactionsQuery,
  characterJournalQuery,
];

const CORPORATION_QUERIES = [
  corporationMarketOrdersQuery,
  corporationHistoricMarketOrdersQuery,
];

const CORPORATION_DIVISION_QUERIES = [
  corporationJournalQuery,
  corporationTransactionsQuery,
];

/**
 * Whether the order and wallet collections behind a set of characters are ready.
 *
 * The selling surfaces read those collections through their own helpers; this reports only whether
 * they have arrived, so a panel can show a spinner rather than an empty table. Corporation
 * collections are subscribed once per corporation, and the wallet ones once per division.
 *
 * @param {string[]|string} characterHashes
 * @returns {{isLoading: boolean, isError: boolean, error: Error|null}}
 */
export function useGetCharacterOrdersAndWalletData(characterHashes) {
  const characters = useUsersStore((store) => store.account.characters);

  const hashes = Array.isArray(characterHashes)
    ? characterHashes.filter(Boolean)
    : [characterHashes].filter(Boolean);

  const requested = (characters ?? []).filter((character) =>
    hashes.includes(character.CharacterHash),
  );

  const corporationIds = [
    ...new Set(requested.map((c) => c.corporation_id).filter(Boolean)),
  ];

  const combine = useCallback((results) => {
    const error = results.find((result) => result.error)?.error ?? null;
    return {
      isLoading: results.some(isQueryObserverResultLoading),
      isError: Boolean(error),
      error,
    };
  }, []);

  return useQueries({
    queries: [
      ...requested.flatMap(({ CharacterHash }) =>
        CHARACTER_QUERIES.map((query) => query(CharacterHash)),
      ),
      ...corporationIds.flatMap((corporationId) =>
        CORPORATION_QUERIES.map((query) => query(corporationId)),
      ),
      ...corporationIds.flatMap((corporationId) =>
        CORPORATION_DIVISION_QUERIES.flatMap((query) =>
          CORPORATION_WALLET_DIVISIONS.map((division) =>
            query(corporationId, division),
          ),
        ),
      ),
    ],
    combine,
  });
}
