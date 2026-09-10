import getCorpJournal from "../../../Functions/EveESI/Corporation/getJournal";
import { isQueryExecutionEnabled } from "../../../Functions/Shared/queryExecutionEnabled";
import { getESIRateLimitStatus } from "../../../Functions/EveESI/fetchWithCustomHeaders";
import fetchPaginatedDataParallel from "../../../Functions/Helper/fetchPaginatedDataParallel";
import {
  corporationMembers,
  readAsAuthorisedMember,
} from "../../../Functions/EveESI/corporationAccess";

const corporationJournalQueryKey = "corporationJournal";
/** ESI rate-limit bucket this collection spends from. */
const corporationJournalQueryGroup = "corporation";

/** Wallet divisions a corporation holds. */
export const CORPORATION_WALLET_DIVISIONS = Object.freeze([1, 2, 3, 4, 5, 6, 7]);

/**
 * React Query configuration for one wallet division's journal.
 *
 * Keyed by **corporation and division**, because ESI grants wallet access one division at a time:
 * a member may read division 1 and be refused division 3. A division is therefore fetched once by
 * whichever member can read it, rather than every member fetching all seven.
 *
 * @param {number|string} corporationId
 * @param {number} division - 1-7
 * @returns {Object} React Query configuration object
 */
function corporationJournalQuery(corporationId, division) {
  const memberHashes = corporationMembers(corporationId);
  // The rate-limit bucket is per character; members are tried in order, so the first is the one
  // whose budget this query normally spends.
  const budgetHash = memberHashes[0];

  return {
    queryKey: [corporationJournalQueryKey, corporationId, division],
    queryFn: async () => {
      const status = getESIRateLimitStatus(
        corporationJournalQueryGroup,
        budgetHash
      );

      if (
        status &&
        status.availableTokens <= 0 &&
        status.maxTokens &&
        status.windowSize
      ) {
        const tokensPerMs = status.maxTokens / status.windowSize;
        const tokensToRecover = status.maxTokens - status.availableTokens;
        const waitTime = Math.ceil(tokensToRecover / tokensPerMs);

        throw new Error(
          `Corporation group is rate limited. Wait ${Math.ceil(waitTime / 1000)} seconds.`
        );
      }

      const data = await readAsAuthorisedMember(
        memberHashes,
        async (member, memberHash) => {
          let forbidden = false;
          const rows = await fetchPaginatedDataParallel(async (page) => {
            const result = await getCorpJournal({
              character: member,
              division,
              page,
              config: {
                characterHash: memberHash,
                group: corporationJournalQueryGroup,
                priority: "normal",
                batchable: true,
              },
            });
            if (result?.forbidden) forbidden = true;
            return result;
          });
          return { rows, forbidden };
        }
      );

      return { data, corporation_id: Number(corporationId), division };
    },
    enabled: isQueryExecutionEnabled(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex, error) => {
      if (error?.message?.includes("rate limited")) {
        const status = getESIRateLimitStatus(
          corporationJournalQueryGroup,
          budgetHash
        );
        if (status && status.maxTokens && status.windowSize) {
          const tokensPerMs = status.maxTokens / status.windowSize;
          const tokensToRecover = status.maxTokens - status.availableTokens;
          const waitTime = Math.ceil(tokensToRecover / tokensPerMs);
          return Math.max(waitTime, 1000);
        }
      }
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  };
}

export {
  corporationJournalQueryKey,
  corporationJournalQuery,
  corporationJournalQueryGroup,
};
