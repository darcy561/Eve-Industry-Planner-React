/**
 * Reads the OAuth values EVE SSO returns on the callback URL.
 *
 * @param {string} [search] — default `window.location.search`
 * @returns {{ authCode: string | null, state: string | null }}
 */
export function getAuthCallbackParams(
  search = typeof window !== "undefined" ? window.location.search : "",
) {
  const urlParams = new URLSearchParams(search);
  return {
    authCode: urlParams.get("code"),
    state: urlParams.get("state"),
  };
}
