import getCorpHistoricMarketOrders from "../../../Functions/EveESI/Corporation/getHistoricMarketOrders";
import { isQueryExecutionEnabled } from "../../../Functions/Shared/queryExecutionEnabled";
import { getESIRateLimitStatus } from "../../../Functions/EveESI/fetchWithCustomHeaders";
import fetchPaginatedDataParallel from "../../../Functions/Helper/fetchPaginatedDataParallel";
import {
  corporationMembers,
  readAsAuthorisedMember,
} from "../../../Functions/EveESI/corporationAccess";

const corporationHistoricMarketOrdersQueryKey =
  "corporationHistoricMarketOrders";
/** ESI rate-limit bucket this collection spends from. */
const corporationHistoricMarketOrdersQueryGroup = "corporation";

/**
 * React Query configuration for a corporation's historic market orders from EVE ESI.
 *
 * Keyed by **corporation**: ESI returns the whole list to any member holding the role, so one
 * fetch serves every member. Members are tried in order and the walk stops at the first that is
 * not refused.
 *
 * @param {number|string} corporationId
 * @returns {Object} React Query configuration object
 */
function corporationHistoricMarketOrdersQuery(corporationId) {
  const memberHashes = corporationMembers(corporationId);
  // The rate-limit bucket is per character; members are tried in order, so the first is the one
  // whose budget this query normally spends.
  const budgetHash = memberHashes[0];

  return {
    queryKey: [corporationHistoricMarketOrdersQueryKey, corporationId],
    queryFn: async () => {
      const status = getESIRateLimitStatus(
        corporationHistoricMarketOrdersQueryGroup,
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
          let forbidden = false;
          const rows = await fetchPaginatedDataParallel(async (page) => {
            const result = await getCorpHistoricMarketOrders({
              character: member,
              page,
              config: {
                characterHash: memberHash,
                group: corporationHistoricMarketOrdersQueryGroup,
                priority: "normal",
                batchable: true,
              },
            });
            if (result?.forbidden) forbidden = true;
            return result;
          });
          return { rows, forbidden };
        },
      );

      return { data, corporation_id: Number(corporationId) };
    },
    enabled: isQueryExecutionEnabled(),
    staleTime: 30 * 60 * 1000, // 30 minutes,
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex, error) => {
      if (error?.message?.includes("rate limited")) {
        const status = getESIRateLimitStatus(
          corporationHistoricMarketOrdersQueryGroup,
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
  corporationHistoricMarketOrdersQueryKey,
  corporationHistoricMarketOrdersQuery,
  corporationHistoricMarketOrdersQueryGroup,
};
