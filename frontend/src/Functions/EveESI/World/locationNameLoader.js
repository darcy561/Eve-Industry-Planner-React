import getUniverseNames from "./getUniverseNames";
import { fetchStructureName, communityNameOrRefusal } from "./getCitadelData";
import { LOCATION_OUTCOME, LocationResolutionError } from "./locationOutcome";
import {
  resolveLocationKind,
  LOCATION_KIND,
} from "../../Assets/assetLocationConstants";

/** ESI resolves up to a thousand ids in one `POST /universe/names`. */
const NAMES_BATCH_SIZE = 1000;

/**
 * Ids waiting to be asked about, and everyone waiting on each.
 *
 * @type {Map<number, {characters: Array<Object>, waiters: Array<{resolve: Function, reject: Function}>}>}
 */
const pending = new Map();
let flushScheduled = false;

/**
 * Asks for one location's name, batched with whatever else is asked for in the same tick.
 *
 * The cache above this is keyed by id, which is what makes two views wanting the same structure one
 * entry rather than two — but a request per id would be a request per name. Everything raised in one
 * tick is collected here and issued as ESI takes it: the public ids in one bulk call, each structure
 * as its own walk. Two callers wanting the same id in the same tick wait on one lookup.
 *
 * @param {number} locationId
 * @param {Array<Object>} characters - the account's characters, tried in order for a structure
 * @returns {Promise<{id: number, name?: string, resolutionStatus: string}>}
 * @throws {LocationResolutionError} the lookup did not settle; the caller retries
 */
export function requestLocationName(locationId, characters = []) {
  return new Promise((resolve, reject) => {
    const waiting = pending.get(locationId);
    if (waiting) {
      waiting.waiters.push({ resolve, reject });
    } else {
      pending.set(locationId, { characters, waiters: [{ resolve, reject }] });
    }

    if (!flushScheduled) {
      flushScheduled = true;
      // A macrotask rather than a microtask: React renders the whole list of views wanting names
      // before yielding, and a microtask would flush after the first of them.
      setTimeout(flush, 0);
    }
  });
}

async function flush() {
  const batch = new Map(pending);
  pending.clear();
  flushScheduled = false;
  if (batch.size === 0) return;

  const publicIds = [];
  const structureIds = [];
  for (const id of batch.keys()) {
    if (resolveLocationKind(id) === LOCATION_KIND.STRUCTURE) {
      structureIds.push(id);
    } else {
      publicIds.push(id);
    }
  }

  await Promise.all([
    ...chunk(publicIds, NAMES_BATCH_SIZE).map((ids) =>
      settlePublicNames(ids, batch),
    ),
    ...structureIds.map((id) => settleStructureName(id, batch)),
  ]);
}

async function settlePublicNames(ids, batch) {
  let named;
  try {
    named = await getUniverseNames(ids);
  } catch (err) {
    for (const id of ids) rejectWaiters(batch, id, err);
    return;
  }

  const byId = new Map(named.map((entry) => [Number(entry.id), entry]));
  for (const id of ids) {
    const entry = byId.get(id);
    settleWaiters(
      batch,
      id,
      entry
        ? { ...entry, id, resolutionStatus: LOCATION_OUTCOME.NAMED }
        : // ESI answered and did not mention it. That is an answer, and keeping it is what stops
          // the id being asked about on every render for the rest of the session.
          { id, resolutionStatus: LOCATION_OUTCOME.UNNAMED },
    );
  }
}

async function settleStructureName(id, batch) {
  const { characters } = batch.get(id);
  let refusals = 0;
  let unaskable = 0;
  let lastFailure = null;

  for (const character of characters) {
    let answer;
    try {
      answer = await fetchStructureName(id, character);
    } catch (err) {
      if (err?.needsReauthorisation) {
        // Not a refusal and not a failure to retry: this token will never carry the scope. The
        // character is simply not one that can answer until it is linked again.
        unaskable += 1;
        reportCharacterNeedsReauthorisation(character);
        continue;
      }
      // This character could not ask this time. Another may still be able to.
      lastFailure = err;
      continue;
    }
    if (!answer.refused) {
      settleWaiters(batch, id, answer.name);
      return;
    }
    refusals += 1;
  }

  // A character that could not ask might have been the one that could see it, so the account has
  // not established that it cannot — settling as no access would make a transient failure permanent.
  if (lastFailure && refusals + unaskable < characters.length) {
    rejectWaiters(batch, id, lastFailure);
    return;
  }
  if (unaskable > 0 && refusals === 0) {
    // Nobody was in a position to ask. Saying "no access" here would state something about the
    // structure that nothing has established.
    rejectWaiters(
      batch,
      id,
      new LocationResolutionError(
        "structure lookup: no character is authorised to read structures",
        { locationId: id, needsReauthorisation: true },
      ),
    );
    return;
  }
  if (characters.length === 0) {
    rejectWaiters(
      batch,
      id,
      new LocationResolutionError("structure lookup: no characters", {
        locationId: id,
      }),
    );
    return;
  }

  try {
    settleWaiters(batch, id, await communityNameOrRefusal(id));
  } catch (err) {
    rejectWaiters(batch, id, err);
  }
}

/**
 * Characters already named as needing re-authorisation, so one un-scoped character is reported once
 * rather than once per location it could not be asked about.
 *
 * @type {Set<string>}
 */
const reportedReauthorisations = new Set();

function reportCharacterNeedsReauthorisation(character) {
  const hash = character?.CharacterHash;
  if (!hash || reportedReauthorisations.has(hash)) return;
  reportedReauthorisations.add(hash);
  console.warn(
    `${character?.CharacterName ?? hash} cannot read structure names: its ESI authorisation predates that permission. Link the character again to restore structure names.`,
  );
}

function settleWaiters(batch, id, outcome) {
  for (const waiter of batch.get(id)?.waiters ?? []) waiter.resolve(outcome);
}

function rejectWaiters(batch, id, error) {
  for (const waiter of batch.get(id)?.waiters ?? []) waiter.reject(error);
}

function chunk(ids, size) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) {
    out.push(ids.slice(i, i + size));
  }
  return out;
}
