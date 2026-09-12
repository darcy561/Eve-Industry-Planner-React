import requestWithPrivateHeaders from "./applyPrivateHeaders.js";

const CITADEL_NAMES_URL = "/api/v1/user/citadel-names";
const PUBLIC_CITADEL_NAMES_URL = "/api/v1/citadel-names";

/**
 * The community structure-name store's two routes.
 *
 * This module is the client and nothing more: what is worth submitting, how submissions are
 * batched and when they are sent belong to the name package that learns the names
 * ({@link ../../EveESI/World/communityNames.js}), beside the ladder that reads them back.
 */

/**
 * Reads the community store's name for a structure.
 *
 * Cached hard by the browser: a submitted name does not change, and this route is the one rung of
 * the ladder that every account shares.
 *
 * @param {number} id
 * @returns {Promise<{name: string}|null>} null when the store has no name, or could not be reached
 */
export async function readCommunityName(id) {
  if (!id) return null;
  try {
    const response = await fetch(`${PUBLIC_CITADEL_NAMES_URL}/${id}`, {
      method: "GET",
      cache: "force-cache",
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error resolving citadel name:", error);
    return null;
  }
}

/**
 * Submits a batch of structure names to the community store.
 *
 * @param {Array<{id: number, name: string}>} submissions
 * @returns {Promise<boolean>} whether the store took them; false is the caller's cue to keep them
 */
export async function submitCommunityNames(submissions) {
  if (!submissions?.length) return true;
  try {
    const response = await requestWithPrivateHeaders(
      CITADEL_NAMES_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissions }),
      },
      { requestName: "submitCitadelNamesBatch" },
    );
    return response.ok;
  } catch (error) {
    console.error("Citadel names batch submit failed:", error);
    return false;
  }
}
