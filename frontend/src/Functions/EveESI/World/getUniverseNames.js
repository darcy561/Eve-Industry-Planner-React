import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import { LocationResolutionError } from "./locationOutcome";
import { asNumberIDSet } from "../../Helper/ids";

/** ESI's answer when the request body itself is unusable, rather than the ids in it. */
export const MALFORMED_REQUEST_STATUS = 400;

/**
 * Retrieves universe names for location IDs from EVE ESI API.
 *
 * @param {Array|Set} requestedLocationIDs - Array or Set of location IDs to get names for
 * @param {Object} [config={}] - Additional configuration options
 * @returns {Promise<Array<{id: number, name: string, category: string}>>} ESI's
 *   own list. Not keyed by id — a caller wanting a lookup builds one. An id ESI does not know is
 *   absent from the list rather than present without a name.
 *
 * @throws {LocationResolutionError} The ids were unusable, or the lookup did not settle. A caller
 *   must not treat a failure as an empty answer: these names do not change, so an empty answer is
 *   cached forever.
 *
 * @example
 * const names = await getUniverseNames([30000142]);
 * // [{ id: 30000142, name: "Jita", category: "solar_system" }]
 */
async function getUniverseNames(requestedLocationIDs, config = {}) {
  if (!requestedLocationIDs) {
    throw new LocationResolutionError("universe names: nothing requested");
  }
  if (
    !Array.isArray(requestedLocationIDs) &&
    !(requestedLocationIDs instanceof Set)
  ) {
    throw new LocationResolutionError(
      "universe names: ids must be an Array or Set",
    );
  }

  // ESI refuses a body holding the same id twice, and refuses an empty one — both with a 400 that
  // resolves nothing in the batch. Reading the ids here rather than trusting each caller keeps that
  // contract in one place, at the edge that owns it: a set, and numbers, so `60003760` and
  // `"60003760"` cannot arrive as two ids.
  const locationIDsArray = [...asNumberIDSet(requestedLocationIDs)];
  if (locationIDsArray.length === 0) {
    throw new LocationResolutionError("universe names: nothing requested");
  }

  // Enhanced configuration for rate limiting
  const enhancedConfig = {
    priority: "normal",
    batchable: true,
    maxRetries: 3,
    useQueue: true,
    group: "universe",
    ...config,
  };

  let response;
  try {
    response = await fetchWithCustomHeaders(
      `https://esi.evetech.net/universe/names/?datasource=tranquility`,
      {
        method: "POST",
        body: JSON.stringify(locationIDsArray),
      },
      enhancedConfig,
    );
  } catch (err) {
    throw new LocationResolutionError("universe names: request failed", {
      cause: err,
    });
  }

  if (!response.ok) {
    throw new LocationResolutionError(
      `universe names: ${response.status} ${response.statusText}`,
      {
        status: response.status,
        // A 400 is the request being rejected — empty, holding a duplicate, or carrying a number
        // outside int32 — rather than an id resolving to nothing. Nothing in the batch was looked
        // at, and the same body would be refused again.
        permanent: response.status === MALFORMED_REQUEST_STATUS,
      },
    );
  }

  let named;
  try {
    named = await response.json();
  } catch (err) {
    throw new LocationResolutionError("universe names: unreadable answer", {
      status: response.status,
      cause: err,
    });
  }
  if (!Array.isArray(named)) {
    // A body that cannot be read is not an answer of "ESI knows none of these". Answering with an
    // empty list would settle every id in the batch as unnamed, and a settled outcome is kept for
    // the session — so the names would never resolve and nothing would say why.
    throw new LocationResolutionError("universe names: unreadable answer", {
      status: response.status,
    });
  }
  return named;
}

export default getUniverseNames;
