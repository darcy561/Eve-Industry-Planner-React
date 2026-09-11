import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import { NO_ACCESS_LOCATION_NAME_PREFIX } from "../../Assets/assetLocationConstants";
import useUsersStore from "../../../Zustand/usersStore";
import {
  buildEsiStructureSubmission,
  queueCitadelStructureSubmission,
  resolveCitadelName,
} from "../../Endpoints/Private/citadelNames";
import { getEsiAccessToken } from "../../Auth/esiCredentials/provider.js";
import {
  LOCATION_OUTCOME,
  LocationResolutionError,
  isRefusalStatus,
} from "./locationOutcome";

/**
 * The two halves of naming a player structure, kept apart on purpose.
 *
 * Docking access is per character and the app cannot know which character holds it, so a structure
 * is named by asking each of them in turn. Composing the ask and the fallback into one call would
 * settle the first character's refusal as the account's answer — which is why nothing here does
 * that, and why the order belongs to the caller walking the characters.
 */

/**
 * Asks ESI for a structure's name as one character, and says which of the two answers it got.
 *
 * Separate from the fallback because the ladder is per account, not per character: the community
 * store is worth asking only once every character has been refused, and a caller walking the
 * characters needs to know a refusal from a name without the fallback having been consulted.
 *
 * @param {number} citadelID
 * @param {Object} character
 * @param {Object} [config={}]
 * @returns {Promise<{refused: true} | {refused: false, name: {id: number, name: string, resolutionStatus: string}}>}
 * @throws {LocationResolutionError} the lookup did not settle
 */
export async function fetchStructureName(citadelID, character, config = {}) {
  if (!citadelID) {
    throw new LocationResolutionError("citadel lookup: no structure id");
  }
  if (!character) {
    throw new LocationResolutionError("citadel lookup: no character", {
      locationId: citadelID,
    });
  }

  let accessToken;
  try {
    ({ accessToken } = await getEsiAccessToken(character.CharacterHash));
  } catch (err) {
    throw new LocationResolutionError("citadel lookup: no access token", {
      locationId: citadelID,
      cause: err,
    });
  }

  // Enhanced configuration for rate limiting
  const enhancedConfig = {
    priority: "normal",
    batchable: true,
    maxRetries: 3,
    useQueue: true,
    group: "universe",
    characterHash: config.characterHash,
    ...config,
  };

  let response;
  try {
    response = await fetchWithCustomHeaders(
      `https://esi.evetech.net/universe/structures/${citadelID}/?datasource=tranquility`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      enhancedConfig
    );
  } catch (err) {
    throw new LocationResolutionError("citadel lookup: request failed", {
      locationId: citadelID,
      cause: err,
    });
  }

  if (response.ok) {
    const json = await response.json();
    json.id = citadelID;
    json.resolutionStatus = LOCATION_OUTCOME.NAMED;
    if (useUsersStore.getState().account?.shareCitadelNames) {
      const submission = buildEsiStructureSubmission(citadelID, json);
      if (submission) {
        queueCitadelStructureSubmission(submission);
      }
    }
    return { refused: false, name: json };
  }

  if (!isRefusalStatus(response.status)) {
    throw new LocationResolutionError(
      `citadel lookup: ${response.status} ${response.statusText}`,
      { locationId: citadelID, status: response.status }
    );
  }

  return { refused: true };
}

/**
 * What a refused structure settles as: the community store's name, or no access.
 *
 * An account that has opted out of the community names does not read them either, so it settles on
 * the refusal without asking.
 *
 * @param {number} citadelID
 * @returns {Promise<{id: number, name: string, resolutionStatus: string}>}
 */
export async function communityNameOrRefusal(citadelID) {
  const refused = {
    id: citadelID,
    name: `${NO_ACCESS_LOCATION_NAME_PREFIX} - ${citadelID}`,
    resolutionStatus: LOCATION_OUTCOME.NO_ACCESS,
  };

  if (useUsersStore.getState().account?.shareCitadelNames === false) {
    return refused;
  }

  const fallback = await resolveCitadelName(citadelID);
  if (!fallback?.name) return refused;

  return {
    id: citadelID,
    name: fallback.name,
    source: "community",
    resolutionStatus: LOCATION_OUTCOME.COMMUNITY,
  };
}
