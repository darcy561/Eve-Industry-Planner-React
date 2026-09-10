import skillsReference from "../../../RawData/bpSkills.json";
import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import { getEsiAccessToken } from "../../Auth/esiCredentials/provider.js";

/**
 * Fetches character skills from EVE ESI API and maps them to skill reference data.
 * Returns a skills map with both active and trained skill levels for all blueprint skills.
 * 
 * @param {Object} params - Parameters object
 * @param {Object} params.character - Character object with CharacterID and CharacterHash
 * @param {Object} [params.existingData={}] - Existing data for caching
 * @param {Object} [params.config={}] - Additional configuration options
 * @returns {Promise<Object>} Promise that resolves to skills map with etag
 * 
 * @example
 * const skills = await getCharacterSkills({
 *   character: { CharacterHash: "hash", CharacterID: 123456 },
 *   config: { characterHash: "hash" }
 * });
 * console.log(skills.data[3385].activeLevel); // Active skill level
 */
async function getCharacterSkills({
  character,
  existingData = {},
  config = {}
}) {
  try {
    if (!character || !character.CharacterHash || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }

    const { CharacterID } = character;
    const { accessToken } = await getEsiAccessToken(character.CharacterHash);
    const endpointURL = `https://esi.evetech.net/characters/${CharacterID}/skills/?datasource=tranquility`;

    // Enhanced configuration for rate limiting
    const enhancedConfig = {
      priority: 'normal',
      batchable: true,
      maxRetries: 3,
      useQueue: true,
      group: 'character',
      characterHash: config.characterHash,
      ...config
    };

    const response = await fetchWithCustomHeaders(
      endpointURL,
      {
        headers: {
          "If-None-Match": existingData?.etag || "",
          Authorization: `Bearer ${accessToken}`,
        },
      },
      enhancedConfig
    );

    // Helper to return default response structure
    const getDefaultResponse = (data = existingData.data || {}) => ({
      data,
      etag: existingData.etag || "",
    });

    // Handle cached/not modified responses
    if (response.status === 304) {
      return getDefaultResponse();
    }

    // Handle no content responses (204)
    if (response.status === 204) {
      return {
        data: {},
        etag: response.headers.get("etag") || "",
      };
    }

    // Handle client errors (4xx)
    if (response.status >= 400 && response.status < 500) {
      // The token cannot read skills. An empty map would have the app state as
      // fact that the character has trained nothing, and quote the untrained
      // broker fee and sales tax for someone who may hold both skills at five.
      if (response.status === 403) {
        return { data: null, etag: "" };
      }
      // Other client errors - throw
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    // Handle server errors (5xx)
    if (response.status >= 500) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    // Handle successful responses (2xx with body)
    const etag = response.headers.get("etag");
    const responseData = await response.json();
    const skillsMap = {};

    Object.values(skillsReference).forEach((ref) => {
      const skill = responseData.skills.find((s) => s.skill_id === ref.id);

      skillsMap[ref.id] = {
        id: ref.id,
        activeLevel: skill?.active_skill_level || 0,
        trainedLevel: skill?.trained_skill_level || 0,
      };
    });

    return {
      data: skillsMap,
      etag,
    };

  } catch (err) {
    // Thrown rather than swallowed into an empty map, so a caller can tell a
    // failed read from a character who has trained nothing.
    console.error(`Error fetching character skills: ${err}`);
    throw err;
  }
}

export default getCharacterSkills;
