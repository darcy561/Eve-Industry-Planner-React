/**
 * Where a character's OAuth refresh material lives, and how it becomes an ESI access token.
 *
 * This is the **only** place the cloud/local distinction is consulted for a token. It is a fact about
 * credential storage, not about scheduling, so nothing above the provider branches on it.
 */
import { decodeJwt } from "jose";
import {
  requestEsiAccessFromClientRefreshSecret,
  requestEsiAccessFromServerStorageBatch,
} from "../../Endpoints/esiAccessClient.js";
import {
  ESI_CREDENTIAL_REAUTH_REQUIRED,
  ESI_CREDENTIAL_RECOVERABLE,
  EsiCredentialError,
} from "./errors.js";

/**
 * @typedef {object} EsiAccessToken
 * @property {string} accessToken
 * @property {number} exp - Unix seconds, read from the JWT rather than from `expires_in`.
 */

/**
 * HTTP status carried on a failed access-token request, when the client attached one.
 * @param {unknown} err
 */
function statusOf(err) {
  const direct = Number(err?.status);
  if (Number.isFinite(direct) && direct > 0) {
    return direct;
  }
  const fromMessage = String(err?.message ?? "").match(/\b(4\d\d|5\d\d)\b/);
  return fromMessage ? Number(fromMessage[1]) : 0;
}

/**
 * A 4xx means the stored material was rejected and will be rejected again; anything else (network,
 * 5xx, a rate limit) is worth another attempt later.
 *
 * @param {unknown} err
 * @param {string} label
 */
function classify(err, label) {
  const status = statusOf(err);
  const classification =
    status >= 400 && status < 500
      ? ESI_CREDENTIAL_REAUTH_REQUIRED
      : ESI_CREDENTIAL_RECOVERABLE;
  return new EsiCredentialError(
    `${label}: ${err?.message ?? String(err)}`,
    classification,
    { cause: err }
  );
}

/**
 * @param {object} response - OAuth-style `{ access_token, refresh_token }`
 * @returns {EsiAccessToken}
 */
function toAccessToken(response) {
  const accessToken = response?.access_token;
  if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
    throw new EsiCredentialError(
      "ESI access refresh returned no access token",
      ESI_CREDENTIAL_REAUTH_REQUIRED
    );
  }
  return { accessToken, exp: Number(decodeJwt(accessToken).exp) || 0 };
}

/**
 * Characters per request, matching `maxAccessTokenBatch` on the Go handler. Over that the server
 * answers 400, which would fail every character in the batch for a reason none of them caused.
 */
const MAX_ACCESS_TOKEN_BATCH = 50;

/**
 * Cloud accounts: refresh material is encrypted in Mongo and never reaches the browser.
 *
 * Acquisitions raised in the same tick are sent as one request. Each costs the server a document
 * read and a document write, so a page mounting hooks for a whole roster would otherwise pay both
 * per character. The provider single-flights per character, which is what leaves several in flight
 * at once for this to gather.
 *
 * @param {object} [deps]
 * @param {(hashes: string[]) => Promise<object>} [deps.request]
 * @param {(fn: Function) => void} [deps.schedule] - Decides how wide the gathering window is.
 */
export function createServerStoredCredentials(deps = {}) {
  const {
    request = requestEsiAccessFromServerStorageBatch,
    schedule = queueMicrotask,
  } = deps;

  /** @type {Map<string, {resolve: Function, reject: Function}[]>} */
  let waiting = new Map();
  let scheduled = false;

  async function sendChunk(chunk) {
    let response;
    try {
      response = await request([...chunk.keys()]);
    } catch (err) {
      // The request failing says nothing about any one credential, so it is never reauth-required:
      // classifying it that way would report every character as dead over a transport fault or a
      // malformed batch, and send the user to a full login for it.
      const failure =
        err instanceof EsiCredentialError
          ? err
          : new EsiCredentialError(
              `server-stored ESI access batch failed: ${err?.message ?? String(err)}`,
              ESI_CREDENTIAL_RECOVERABLE,
              { cause: err }
            );
      for (const waiters of chunk.values()) {
        waiters.forEach(({ reject }) => reject(failure));
      }
      return;
    }

    const byHash = new Map(
      (response?.tokens ?? []).map((row) => [row.character_hash, row])
    );
    for (const [characterHash, waiters] of chunk) {
      const row = byHash.get(characterHash);
      try {
        if (!row || row.error) {
          throw new EsiCredentialError(
            `server-stored ESI access refresh failed for ${characterHash}: ${
              row?.error ?? "no result returned"
            }`,
            ESI_CREDENTIAL_REAUTH_REQUIRED
          );
        }
        const token = toAccessToken({ access_token: row.access_token });
        waiters.forEach(({ resolve }) => resolve(token));
      } catch (err) {
        waiters.forEach(({ reject }) => reject(err));
      }
    }
  }

  function send(batch) {
    const entries = [...batch.entries()];
    for (let i = 0; i < entries.length; i += MAX_ACCESS_TOKEN_BATCH) {
      void sendChunk(new Map(entries.slice(i, i + MAX_ACCESS_TOKEN_BATCH)));
    }
  }

  return {
    name: "server",
    refresh(characterHash) {
      return new Promise((resolve, reject) => {
        const waiters = waiting.get(characterHash) ?? [];
        waiters.push({ resolve, reject });
        waiting.set(characterHash, waiters);

        if (scheduled) return;
        scheduled = true;
        schedule(() => {
          const batch = waiting;
          waiting = new Map();
          scheduled = false;
          send(batch);
        });
      });
    },
  };
}

export const serverStoredCredentials = createServerStoredCredentials();

/**
 * Local accounts: the browser holds the refresh secret. EVE SSO may return a rotated one, which has
 * to be written back or the next refresh presents a spent secret.
 *
 * @param {object} deps
 * @param {(characterHash: string) => string} deps.readSecret
 * @param {(characterHash: string, secret: string) => void} deps.writeSecret
 */
export function createClientHeldCredentials({ readSecret, writeSecret }) {
  return {
    name: "client",
    async refresh(characterHash) {
      const secret = readSecret(characterHash);
      if (typeof secret !== "string" || secret.trim().length === 0) {
        throw new EsiCredentialError(
          `no client-held ESI refresh secret for ${characterHash}`,
          ESI_CREDENTIAL_REAUTH_REQUIRED
        );
      }
      let response;
      try {
        response = await requestEsiAccessFromClientRefreshSecret(secret);
      } catch (err) {
        throw classify(err, "client-held ESI access refresh failed");
      }
      const token = toAccessToken(response);
      if (typeof response.refresh_token === "string" && response.refresh_token.trim()) {
        writeSecret(characterHash, response.refresh_token);
      }
      return token;
    },
  };
}
