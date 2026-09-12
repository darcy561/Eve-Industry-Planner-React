import { routeForPath } from "./routeAccess.js";

/**
 * Where a reader lands once they have signed in.
 *
 * `originalPath` comes from the OAuth `state` EVE hands back, which is not always a path:
 * a main login sends "main" and an additional-account import sends a handshake nonce.
 * Anything the app has no route for goes to `defaultPath`, because handing it to the
 * router resolves it against `/auth` and lands on a page that does not exist.
 *
 * @param {string | null | undefined} originalPath - Where they were headed.
 * @param {string} [defaultPath]
 * @returns {string}
 */
export function getRedirectPathAfterAuth(
  originalPath,
  defaultPath = "/dashboard",
) {
  if (!originalPath?.startsWith("/")) return defaultPath;

  // Signing in from a protected page lands on the default rather than back where a
  // half-built session came from. A job or group id counts as protected too: it means
  // nothing to a reader who is not signed in yet.
  const route = routeForPath(originalPath);
  if (!route || route.underProtectedLayout || route.hasParam) {
    return defaultPath;
  }
  return originalPath;
}
