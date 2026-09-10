import GLOBAL_CONFIG from "../../../global-config-app";
import fetchWithCustomHeaders from "../fetchWithCustomHeaders";
import { getEsiAccessToken } from "../../Auth/esiCredentials/provider.js";

/**
 * Fetches one wallet division's transactions for a corporation.
 *
 * A division at a time, because role access is granted per division and the query that calls this
 * is keyed per division — a member who cannot read division 3 may still read division 1.
 *
 * @param {Object} args
 * @param {Object} args.character - the member whose token makes the call
 * @param {number} args.division - wallet division, 1-7
 * @param {Object} [args.existingData] - previous response, for the etag
 * @param {Object} [args.config] - rate-limiting configuration
 * @returns {Promise<{data: Array<Object>, eTags: string, division: number, forbidden?: boolean}>}
 */
async function getCorpTransactions({
  character,
  division,
  existingData = {},
  config = {},
}) {
  try {
    if (!character || !character.CharacterHash || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }

    const { corporation_id } = character;
    const { accessToken } = await getEsiAccessToken(character.CharacterHash);
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;

    const endpointURL = `https://esi.evetech.net/corporations/${corporation_id}/wallets/${division}/transactions?datasource=tranquility`;

    const enhancedConfig = {
      priority: "normal",
      batchable: true,
      maxRetries: 3,
      useQueue: true,
      group: "corporation",
      characterHash: config.characterHash,
      ...config,
    };

    const response = await fetchWithCustomHeaders(
      endpointURL,
      {
        headers: {
          "If-None-Match": existingData?.eTags || "",
          Authorization: `Bearer ${accessToken}`,
        },
      },
      enhancedConfig
    );

    if (response.status === 304) {
      return {
        data: existingData?.data || [],
        eTags: existingData?.eTags || "",
        division,
      };
    }

    if (response.status === 204) {
      return { data: [], eTags: "", division };
    }

    if (response.status >= 400 && response.status < 500) {
      if (response.status === 403) {
        console.warn(
          `Access forbidden for corporation transactions division ${division}: ${corporation_id}`
        );
        // Reported rather than folded into empty rows: the caller tries another member for this
        // division on a refusal, and cannot tell one from a division that holds nothing.
        return { data: [], eTags: "", division, forbidden: true };
      }
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    if (response.status >= 500) {
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const eTags = response.headers.get("etag");
    const currentDate = Date.now();
    const data = (await response.json())
      .filter(
        (item) =>
          currentDate - Date.parse(item.date) <=
            ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 && !item.is_buy
      )
      .map((transaction) => ({
        ...transaction,
        corporation_id,
        division,
      }));

    return { data, eTags, division };
  } catch (err) {
    console.error(
      `Error fetching corporation transactions division ${division}: ${err}`
    );
    return { data: [], eTags: "", division };
  }
}

export default getCorpTransactions;
