import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import GLOBAL_CONFIG from "../../../global-config-app";
import { getEsiAccessToken } from "../../Auth/esiCredentials/provider.js";

async function getCorpIndustryJobs({ character, page = 1, existingData = {}, config = {} }) {
  try {
    if (
      !character ||
      !character.CharacterID ||
      !character.CharacterHash ||
      !character.corporation_id
    ) {
      throw new Error("Character information is incomplete.");
    }

    const { CharacterID, corporation_id } = character;
    const { accessToken } = await getEsiAccessToken(character.CharacterHash);
    const endpointURL = `https://esi.evetech.net/corporations/${corporation_id}/industry/jobs/?include_completed=true&datasource=tranquility&page=${page}`;

    // Enhanced configuration for rate limiting
    const enhancedConfig = {
      priority: 'normal',
      batchable: true,
      maxRetries: 3,
      useQueue: true,
      group: 'industry',
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
    const getDefaultResponse = (data = existingData.data || []) => ({
      data,
      etag: existingData.etag || "",
      totalPages: existingData.totalPages || 1,
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
        totalPages: parseInt(response.headers.get("x-pages") || "1", 10),
      };
    }

    // Handle client errors (4xx)
    if (response.status >= 400 && response.status < 500) {
      // Permission errors - return empty data gracefully
      if (response.status === 403) {
        console.warn(
          `Access forbidden for corporation industry jobs: ${corporation_id}`
        );
        // Reported rather than folded into empty rows: the caller tries another member on a
        // refusal, and cannot tell one from a corporation that genuinely holds nothing.
        return {
          data: [],
          etag: "",
          totalPages: 1,
          forbidden: true,
        };
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
    const totalPages = parseInt(response.headers.get("x-pages") || "1", 10);
    let data = await response.json();

    // Filter jobs based on date period and installer
    const currentDate = Date.now();
    // Every member's jobs are kept. Which of them a surface shows is decided by the planner
    // being viewed, not here — a corporation planner shows the whole corporation's work.
    data = data
      .filter(
        (job) =>
          !job.completed_date ||
          currentDate - Date.parse(job.completed_date) <=
            GLOBAL_CONFIG.ESI_DATE_PERIOD * 24 * 60 * 60 * 1000
      )
      .map((job) => ({ ...job, is_corporation: true, corporation_id, character_id: CharacterID }));

    return {
      data,
      etag,
      totalPages,
    };
  } catch (err) {
    console.error(`Error fetching corporation industry jobs: ${err}`);
    // Return empty data for any other errors
    return {
      data: [],
      etag: "",
      totalPages: 1,
    };
  }
}

export default getCorpIndustryJobs;
