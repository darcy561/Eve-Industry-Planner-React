import useUsersStore from "../../../Zustand/usersStore";
import { getESIRateLimitStatus } from "../fetchWithCustomHeaders";
import { COLLECTIONS, PHASE, PREFETCHED_PHASES, SCOPE } from "./collections";
import { CORPORATION_WALLET_DIVISIONS } from "../../../Hooks/React Query/Corporation/journal";
import {
  ENABLE_QUERY_WATERFALL_LOGGING,
  logWaterfall,
  startQueryTracking,
} from "../../Debugging/queryWaterfallLogger";

/**
 * How many collections the prefetch may have in flight at once.
 *
 * The bound is collections, not characters: capping characters meant three at a time each carrying
 * the whole table, so the ceiling grew with the account. It is not yet a bound on ESI requests —
 * the corporation journal and transactions queries each fan out over seven wallet divisions
 * internally, so one in-flight collection can be seven requests.
 */
const MAX_CONCURRENT_COLLECTIONS = 8;

/**
 * @typedef {Object} PrefetchItem
 * @property {string} name - the collection's name, for tracking
 * @property {string} group - ESI rate-limit bucket
 * @property {string} budgetHash - the character whose bucket this request spends
 * @property {Object} query - React Query configuration object
 */

/**
 * Expands the collection table into the work an account actually needs.
 *
 * A `CHARACTER` collection produces one item per character; a `CORPORATION` collection one per
 * distinct corporation among those characters, which is what stops a corporation-wide list being
 * fetched once per member; a `CORPORATION_DIVISION` collection one per corporation *and* wallet
 * division, because ESI grants wallet access a division at a time. `ON_DEMAND` produces none.
 *
 * @param {string[]} characterHashes
 * @param {string} phase
 * @returns {PrefetchItem[]}
 */
export function planPrefetch(characterHashes, phase) {
  const { actions, corporations } = useUsersStore.getState().account;
  const characters = characterHashes
    .map((hash) => actions.findCharacterByHash(hash))
    .filter(Boolean);

  const items = [];

  // On-demand collections have no prefetch work by definition; planning them would quietly undo
  // the decision their table row records.
  if (phase === PHASE.ON_DEMAND) return items;

  for (const collection of COLLECTIONS) {
    if (collection.phase !== phase) continue;

    if (
      collection.scope === SCOPE.CORPORATION ||
      collection.scope === SCOPE.CORPORATION_DIVISION
    ) {
      const perCorporation =
        collection.scope === SCOPE.CORPORATION_DIVISION
          ? CORPORATION_WALLET_DIVISIONS
          : [undefined];
      const seen = new Set();

      for (const character of characters) {
        const corporationId = character.corporation_id;
        if (!corporationId || seen.has(corporationId)) continue;
        seen.add(corporationId);

        for (const division of perCorporation) {
          items.push({
            name: division
              ? `${collection.name} (division ${division})`
              : collection.name,
            group: collection.group,
            // A corporation query walks its members and spends the first one's bucket, so the gate
            // here has to consult that same character rather than whichever member was reached
            // first.
            budgetHash:
              firstMemberOf(corporations, corporationId) ??
              character.CharacterHash,
            query: collection.query(corporationId, division),
          });
        }
      }
      continue;
    }

    for (const character of characters) {
      items.push({
        name: collection.name,
        group: collection.group,
        budgetHash: character.CharacterHash,
        query: collection.query(character.CharacterHash),
      });
    }
  }

  return items;
}

/**
 * The member whose token a corporation-scoped query will use.
 *
 * @param {Array<Object>|undefined} corporations
 * @param {number|string} corporationId
 * @returns {string|undefined}
 */
function firstMemberOf(corporations, corporationId) {
  const corporation = corporations?.find(
    (c) => Number(c.corporation_id) === Number(corporationId)
  );
  return corporation?.members?.[0];
}

/**
 * True when the item's rate-limit bucket has nothing left to spend.
 *
 * @param {PrefetchItem} item
 * @returns {boolean}
 */
function isBucketExhausted({ group, budgetHash }) {
  const status = getESIRateLimitStatus(group, budgetHash);
  return Boolean(
    status && status.maxTokens && status.windowSize && status.availableTokens <= 0
  );
}

/**
 * Fetches one item, reporting failure whether or not waterfall logging is on.
 *
 * @param {Object} queryClient
 * @param {PrefetchItem} item
 */
async function fetchItem(queryClient, item) {
  const trackQuery = startQueryTracking(item.name, item.budgetHash);
  try {
    await queryClient.fetchQuery(item.query);
  } catch (error) {
    // Reported unconditionally: an unlogged failure is a collection silently missing with nothing
    // to show for it.
    console.error(`${item.name} prefetch failed for ${item.budgetHash}`, error);
  } finally {
    const duration = trackQuery();
    if (ENABLE_QUERY_WATERFALL_LOGGING) {
      console.log(
        `[${item.budgetHash.slice(0, 8)}] ${item.name} (${duration.toFixed(0)}ms)`
      );
    }
  }
}

/**
 * Runs a phase's items, at most {@link MAX_CONCURRENT_COLLECTIONS} in flight.
 *
 * An item whose bucket is exhausted is moved to the back of the phase rather than fired into a
 * refusal; if every remaining item is exhausted the phase stops and their consumers fetch on mount.
 *
 * @param {Object} queryClient
 * @param {PrefetchItem[]} items
 */
async function runPhase(queryClient, items) {
  const queue = [...items];
  let deferredInARow = 0;
  const running = new Set();

  while (queue.length > 0) {
    if (running.size >= MAX_CONCURRENT_COLLECTIONS) {
      await Promise.race(running);
      continue;
    }

    const item = queue.shift();

    if (isBucketExhausted(item)) {
      deferredInARow += 1;
      if (deferredInARow > queue.length + 1) break;
      queue.push(item);
      continue;
    }
    deferredInARow = 0;

    const task = fetchItem(queryClient, item).finally(() => running.delete(task));
    running.add(task);
  }

  await Promise.all(running);
}

/**
 * Warms the ESI collections an account needs, in phase order.
 *
 * This is the single entry point for login. Query definitions decide for themselves whether they
 * may run — a logged-out session or a Tranquility outage disables them — and that decision is
 * honoured here rather than overridden, so an outage no longer means firing the whole table at an
 * offline server.
 *
 * @param {Object} queryClient - React Query client instance
 * @param {string[]} characterHashes
 * @param {boolean} [shouldLog] - print the query waterfall when it finishes
 */
export async function prefetchCollections(queryClient, characterHashes, shouldLog = false) {
  const hashes = characterHashes?.filter(Boolean) ?? [];
  if (hashes.length === 0) return;

  const start = performance.now();

  for (const phase of PREFETCHED_PHASES) {
    const items = planPrefetch(hashes, phase).filter(
      (item) => item.query.enabled !== false
    );
    if (items.length > 0) {
      await runPhase(queryClient, items);
    }
  }

  if (shouldLog) {
    const duration = performance.now() - start;
    console.log(
      `Prefetch complete for ${hashes.length} character(s) in ${duration.toFixed(2)}ms`
    );
    logWaterfall();
  }
}
