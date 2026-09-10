import getCorpBlueprints from "../../../Functions/EveESI/Corporation/getBlueprints";
import useUsersStore from "../../../Zustand/usersStore";
import { isQueryExecutionEnabled } from "../../../Functions/Shared/queryExecutionEnabled";
import { getESIRateLimitStatus } from "../../../Functions/EveESI/fetchWithCustomHeaders";
import fetchPaginatedDataParallel from "../../../Functions/Helper/fetchPaginatedDataParallel";
const corporationBlueprintsQueryKey = "corporationBlueprints";
/** ESI rate-limit bucket this collection spends from. */
const corporationBlueprintsQueryGroup = "corporation";

/**
 * Resolves the members whose tokens may fetch a corporation's blueprints.
 *
 * @param {number|string} corporationId
 * @returns {string[]} CharacterHashes, in the order they will be tried
 */
function findCorporationMembers(corporationId) {
  const { corporations } = useUsersStore.getState().account;
  const corporation = corporations?.find(
    (c) => Number(c.corporation_id) === Number(corporationId)
  );
  return corporation?.members ?? [];
}

/**
 * React Query configuration for fetching a corporation's blueprints from EVE ESI.
 *
 * Keyed by **corporation**, not by character. ESI treats the corporation blueprint list as a
 * single access point — any member with the role returns the whole list — so one fetch serves
 * every member. Members are tried in order and the walk stops at the first that is not refused,
 * which keeps a corporation visible when its first tracked character lacks the role.
 *
 * @param {number|string} corporationId
 * @returns {Object} React Query configuration object
 * @returns {Array} returns.queryKey - Query key array for React Query
 * @returns {Function} returns.queryFn - Async function to fetch corporation blueprints
 * @returns {boolean} returns.enabled - Whether the query is enabled
 * @returns {number} returns.staleTime - Time before data is considered stale (30 minutes)
 * @returns {number} returns.gcTime - Inactive cache retention in ms (1 hour)
 * @returns {number} returns.retry - Number of retry attempts (3)
 * @returns {Function} returns.retryDelay - Function to calculate retry delay
 * @returns {boolean} returns.refetchOnWindowFocus - Whether to refetch on window focus (false)
 * @returns {boolean} returns.refetchOnMount - Whether to refetch on component mount (false)
 */
function corporationBlueprintsQuery(corporationId) {
  const findCharacterByHash = useUsersStore.getState().account.actions.findCharacterByHash;
  const memberHashes = findCorporationMembers(corporationId);
  // The rate-limit bucket is per character. Members are tried in order, so the first is the one
  // whose budget this query normally spends.
  const budgetHash = memberHashes[0];

  return {
    queryKey: [corporationBlueprintsQueryKey, corporationId],
    queryFn: async () => {
      const corporationStatus = getESIRateLimitStatus('corporation', budgetHash);

      if (corporationStatus && corporationStatus.availableTokens <= 0 && corporationStatus.maxTokens && corporationStatus.windowSize) {
        const tokensPerMs = corporationStatus.maxTokens / corporationStatus.windowSize;
        const tokensToRecover = corporationStatus.maxTokens - corporationStatus.availableTokens;
        const waitTime = Math.ceil(tokensToRecover / tokensPerMs);

        throw new Error(`Corporation group is rate limited. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }

      try {
        for (const memberHash of memberHashes) {
          const member = findCharacterByHash(memberHash);
          if (!member) continue;

          let forbidden = false;
          const allData = await fetchPaginatedDataParallel(async (page) => {
            const result = await getCorpBlueprints({
              character: member,
              page: page,
              config: {
                characterHash: memberHash,
                group: corporationBlueprintsQueryGroup,
                priority: 'normal',
                batchable: true
              }
            });
            if (result?.forbidden) forbidden = true;
            return result;
          });

          if (forbidden) continue;

          return {
            data: allData,
            corporation_id: Number(corporationId),
          };
        }

        return { data: [], corporation_id: Number(corporationId) };
      } catch (error) {
        console.error('Error fetching corporation blueprints:', error);
        throw new Error(`Failed to fetch corporation blueprints: ${error.message}`);
      }
    },
    enabled: isQueryExecutionEnabled(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex, error) => {
      if (error?.message?.includes('rate limited')) {
        const corporationStatus = getESIRateLimitStatus('corporation', budgetHash);
        if (corporationStatus && corporationStatus.maxTokens && corporationStatus.windowSize) {
          const tokensPerMs = corporationStatus.maxTokens / corporationStatus.windowSize;
          const tokensToRecover = corporationStatus.maxTokens - corporationStatus.availableTokens;
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

export { corporationBlueprintsQueryKey, corporationBlueprintsQuery, corporationBlueprintsQueryGroup };