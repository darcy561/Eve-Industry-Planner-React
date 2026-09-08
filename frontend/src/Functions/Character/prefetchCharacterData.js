/**
 * Warms the React Query cache for a character's ESI data. Called from login, tab resume and add-alt,
 * all outside a component.
 */
import { characterSkillsQuery } from "../../Hooks/React Query/Character/skills";
import { characterStandingsQuery } from "../../Hooks/React Query/Character/standings";
import { characterBlueprintsQuery } from "../../Hooks/React Query/Character/blueprints";
import { characterHistoricMarketOrdersQuery } from "../../Hooks/React Query/Character/historicMarketOrders";
import { characterIndustryJobsQuery } from "../../Hooks/React Query/Character/industryJobs";
import { characterJournalQuery } from "../../Hooks/React Query/Character/journal";
import { characterMarketOrdersQuery } from "../../Hooks/React Query/Character/marketOrders";
import { characterTransactionsQuery } from "../../Hooks/React Query/Character/transactions";
import { corporationTransactionsQuery } from "../../Hooks/React Query/Corporation/transactions";
import { corporationMarketOrdersQuery } from "../../Hooks/React Query/Corporation/marketOrders";
import { corporationHistoricMarketOrdersQuery } from "../../Hooks/React Query/Corporation/historicMarketOrders";
import { corporationIndustryJobsQuery } from "../../Hooks/React Query/Corporation/industryJobs";
import { corporationBlueprintsQuery } from "../../Hooks/React Query/Corporation/blueprints";
import { corporationJournalQuery } from "../../Hooks/React Query/Corporation/journal";
import {
  ENABLE_QUERY_WATERFALL_LOGGING,
  logWaterfall,
  startQueryTracking,
} from "../Debugging/queryWaterfallLogger";

/** Every query one character contributes, named for the waterfall log. */
export const CHARACTER_PREFETCH_QUERIES = [
  ["Character Skills", characterSkillsQuery],
  ["Character Standings", characterStandingsQuery],
  ["Character Blueprints", characterBlueprintsQuery],
  ["Character Historic Market Orders", characterHistoricMarketOrdersQuery],
  ["Character Industry Jobs", characterIndustryJobsQuery],
  ["Character Journal", characterJournalQuery],
  ["Character Market Orders", characterMarketOrdersQuery],
  ["Character Transactions", characterTransactionsQuery],
  ["Corporation Transactions", corporationTransactionsQuery],
  ["Corporation Market Orders", corporationMarketOrdersQuery],
  ["Corporation Historic Market Orders", corporationHistoricMarketOrdersQuery],
  ["Corporation Industry Jobs", corporationIndustryJobsQuery],
  ["Corporation Blueprints", corporationBlueprintsQuery],
  ["Corporation Journal", corporationJournalQuery],
];

/**
 * Characters prefetched at once. Each contributes fourteen queries, so this is what stops a large
 * roster opening a hundred ESI requests in one go.
 */
const MAX_CONCURRENT_CHARACTERS = 3;

/**
 * Runs one query and records how long it took.
 *
 * `fetchQuery` rather than `prefetchQuery`, and `enabled` forced, because both would skip a query
 * whose hook is not mounted — which at prefetch time is all of them. Timing starts before the
 * promise exists so a query that fails inside `queryFn` is still measured from the right moment.
 *
 * @param {object} queryClient
 * @param {string} characterHash
 * @param {[string, Function]} query - Display name and the query-config factory.
 */
async function fetchTracked(queryClient, characterHash, [name, queryFactory]) {
  const trackQuery = startQueryTracking(name, characterHash);
  let tracked = false;
  const markTracked = () => {
    if (tracked) return;
    tracked = true;
    const duration = trackQuery();
    if (ENABLE_QUERY_WATERFALL_LOGGING) {
      console.log(`[${characterHash.slice(0, 8)}] ${name} (${duration.toFixed(0)}ms)`);
    }
  };

  try {
    await queryClient.fetchQuery({ ...queryFactory(characterHash), enabled: true });
  } catch (error) {
    // Reported unconditionally: the caller settles these, so an unlogged failure is a collection
    // silently missing from the character with nothing to show for it.
    console.error(`${name} prefetch failed for ${characterHash}`, error);
    throw error;
  } finally {
    markTracked();
  }
}

/**
 * Warms every query for one character. Failures are settled rather than thrown: one endpoint being
 * unavailable must not deny the character the rest of its data.
 *
 * @param {object} queryClient
 * @param {string} characterHash
 * @param {boolean} [shouldLog=false] - Print the waterfall when the whole character is done.
 * @returns {Promise<void>}
 */
export async function prefetchCharacterData(queryClient, characterHash, shouldLog = false) {
  const start = performance.now();

  await Promise.allSettled(
    CHARACTER_PREFETCH_QUERIES.map((query) => fetchTracked(queryClient, characterHash, query))
  );

  if (shouldLog) {
    const duration = performance.now() - start;
    console.log(
      `All queries completed for ${characterHash.slice(0, 8)} in ${duration.toFixed(2)}ms`
    );
    logWaterfall();
  }
}

/**
 * Warms several characters, at most {@link MAX_CONCURRENT_CHARACTERS} at a time.
 *
 * @param {object} queryClient
 * @param {string[]} characterHashes
 * @param {boolean} [shouldLog=false]
 * @returns {Promise<void>}
 */
export async function prefetchMultipleCharacters(queryClient, characterHashes, shouldLog = false) {
  for (let i = 0; i < characterHashes.length; i += MAX_CONCURRENT_CHARACTERS) {
    const batch = characterHashes.slice(i, i + MAX_CONCURRENT_CHARACTERS);
    await Promise.all(batch.map((hash) => prefetchCharacterData(queryClient, hash)));
  }

  if (shouldLog && characterHashes.length > 0) {
    logWaterfall();
  }
}
