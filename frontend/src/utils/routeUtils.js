import { routeForPath } from "./routeAccess.js";

/**
 * Where a reader lands once they have signed in.
 *
 * `returnTo` is the location this tab remembered before leaving for EVE. It never
 * crossed the network, but it is still checked: it has to be a route the app has, and
 * `//evil.com` is a protocol-relative URL that leaves the site while reading as a path.
 * `/auth` and `/signout` are somewhere a reader passes through, never somewhere to be
 * put back.
 *
 * @param {string | null | undefined} returnTo - Where they were before signing in.
 * @param {string} [defaultPath]
 * @returns {string}
 */
export function getRedirectPathAfterAuth(returnTo, defaultPath = "/dashboard") {
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) {
    return defaultPath;
  }

  const route = routeForPath(returnTo);
  if (!route || route.audience === "transient") return defaultPath;
  return returnTo;
}
