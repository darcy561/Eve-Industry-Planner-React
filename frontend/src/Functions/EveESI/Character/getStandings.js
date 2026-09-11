import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import { getEsiAccessToken } from "../../Auth/esiCredentials/provider.js";

async function getCharacterStandings({ character, existingData = {} }) {
  try {
    if (!character || !character.CharacterHash || !character.CharacterID) {
      throw new Error("Character information is incomplete.");
    }

    const { CharacterID } = character;
    const { accessToken } = await getEsiAccessToken(character.CharacterHash);
    const endpointURL = `https://esi.evetech.net/characters/${CharacterID}/standings/?datasource=tranquility`;

    const response = await fetchWithCustomHeaders(endpointURL, {
      headers: {
        "If-None-Match": existingData?.etag || "",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Helper to return default response structure
    const getDefaultResponse = (data = existingData.data || []) => ({
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
        data: [],
        etag: response.headers.get("etag") || "",
      };
    }

    // Handle client errors (4xx)
    if (response.status >= 400 && response.status < 500) {
      // The token cannot read standings. That is not the same as the character
      // having none, and returning an empty list would have the app state as
      // fact that they hold no standing anywhere.
      if (response.status === 403) {
        return { data: null, etag: "" };
      }
      // Other client errors - throw
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    // Handle server errors (5xx)
    if (response.status >= 500) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    // Handle successful responses (2xx with body)
    const etag = response.headers.get("etag");
    const data = await response.json();

    return {
      data,
      etag,
    };
  } catch (err) {
    // Thrown rather than swallowed into an empty list: every fee quoted from
    // standings that failed to load is wrong, and a caller that cannot tell the
    // difference states the wrong one confidently.
    console.error(`Error fetching character standings: ${err}`);
    throw err;
  }
}

export default getCharacterStandings;
