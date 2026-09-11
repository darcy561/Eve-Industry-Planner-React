/**
 * Builds a {@link Character} from OAuth refresh material, for the login and hydration flows that run
 * before a character exists to acquire tokens for.
 *
 * The access token that falls out of the exchange is handed to the credential provider rather than
 * discarded, so the first query for that character does not immediately exchange again.
 */
import { decodeJwt } from "jose";
import Character from "../../Classes/character";
import {
  requestEsiAccessFromClientRefreshSecret,
  requestEsiAccessFromServerStorage,
} from "../Endpoints/esiAccessClient.js";
import { adoptEsiAccessToken } from "./esiCredentials/provider.js";

/**
 * @param {object} tokenResponse - OAuth-style `{ access_token, refresh_token }`
 * @param {boolean} isMainCharacter
 * @returns {Character}
 */
function characterFromTokenResponse(tokenResponse, isMainCharacter) {
  const character = new Character({
    jwtPayload: decodeJwt(tokenResponse.access_token),
    tokenResponse,
    isMainCharacter,
  });
  adoptEsiAccessToken(character.CharacterHash, tokenResponse.access_token);
  return character;
}

/**
 * A session response already carrying an ESI access token — the login and bootstrap payloads bundle
 * one per linked character, so no exchange is needed.
 *
 * @param {string} accessToken
 * @param {object} [options]
 * @param {boolean} [options.isMainCharacter=false]
 * @returns {Character}
 */
export function buildCharacterFromAccessToken(accessToken, options = {}) {
  return characterFromTokenResponse(
    { access_token: accessToken, refresh_token: "" },
    options.isMainCharacter ?? false,
  );
}

/**
 * Local accounts: the browser holds the refresh secret. The main character's secret is also what a
 * cold reload resumes from, so a failure there clears it rather than leaving a secret that no longer
 * works.
 *
 * @param {string} refreshSecret
 * @param {object} [options]
 * @param {boolean} [options.isMainCharacter=false]
 * @returns {Promise<Character|Error>} An {@link Error} on failure — callers branch on `instanceof`.
 */
export async function buildCharacterFromClientSecret(
  refreshSecret,
  options = {},
) {
  const { isMainCharacter = false } = options;
  try {
    const tokenResponse =
      await requestEsiAccessFromClientRefreshSecret(refreshSecret);
    const character = characterFromTokenResponse(
      tokenResponse,
      isMainCharacter,
    );
    if (isMainCharacter && tokenResponse.refresh_token) {
      localStorage.setItem("Auth", tokenResponse.refresh_token);
    }
    return character;
  } catch (err) {
    console.error(err);
    if (isMainCharacter) {
      localStorage.removeItem("Auth");
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}

/**
 * Cloud accounts: refresh material stays in Mongo, so only the character hash is needed and nothing
 * is written client-side.
 *
 * @param {string} characterHash
 * @returns {Promise<Character|null>}
 */
export async function buildCharacterFromStoredCredential(characterHash) {
  const hash = typeof characterHash === "string" ? characterHash.trim() : "";
  if (!hash) return null;
  try {
    const tokenResponse = await requestEsiAccessFromServerStorage(hash);
    if (!tokenResponse?.access_token) {
      console.warn("Cloud-stored ESI access returned no token for", hash);
      return null;
    }
    return characterFromTokenResponse(tokenResponse, false);
  } catch (err) {
    console.error(`Cloud-stored ESI access failed for ${hash}:`, err);
    return null;
  }
}
