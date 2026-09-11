import getCorpTransactions from "../../../Functions/EveESI/Corporation/getTransactions";
import { isQueryExecutionEnabled } from "../../../Functions/Shared/queryExecutionEnabled";
import { getESIRateLimitStatus } from "../../../Functions/EveESI/fetchWithCustomHeaders";
import {
  corporationMembers,
  readAsAuthorisedMember,
} from "../../../Functions/EveESI/corporationAccess";

const corporationTransactionsQueryKey = "corporationTransactions";
/** ESI rate-limit bucket this collection spends from. */
const corporationTransactionsQueryGroup = "corporation";

/**
 * React Query configuration for one wallet division's transactions.
 *
 * Keyed by **corporation and division**, because ESI grants wallet access one division at a time:
 * a member may read division 1 and be refused division 3. A division is therefore fetched once by
 * whichever member can read it, rather than every member fetching all seven.
 *
 * @param {number|string} corporationId
 * @param {number} division - 1-7
 * @returns {Object} React Query configuration object
 */
function corporationTransactionsQuery(corporationId, division) {
  const memberHashes = corporationMembers(corporationId);
  // The rate-limit bucket is per character; members are tried in order, so the first is the one
  // whose budget this query normally spends.
  const budgetHash = memberHashes[0];

  return {
    queryKey: [corporationTransactionsQueryKey, corporationId, division],
    queryFn: async () => {
      const status = getESIRateLimitStatus(
        corporationTransactionsQueryGroup,
        budgetHash,
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
          `Corporation group is rate limited. Wait ${Math.ceil(waitTime / 1000)} seconds.`,
        );
      }

      const data = await readAsAuthorisedMember(
        memberHashes,
        async (member, memberHash) => {
          const result = await getCorpTransactions({
            character: member,
            division,
            config: {
              characterHash: memberHash,
              group: corporationTransactionsQueryGroup,
              priority: "normal",
              batchable: true,
            },
          });
          return {
            rows: result?.data ?? [],
            forbidden: Boolean(result?.forbidden),
          };
        },
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
          corporationTransactionsQueryGroup,
          budgetHash,
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
  corporationTransactionsQueryKey,
  corporationTransactionsQuery,
  corporationTransactionsQueryGroup,
};
