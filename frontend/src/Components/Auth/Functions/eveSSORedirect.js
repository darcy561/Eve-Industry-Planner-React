import { getRuntimeEnv } from "../../../utils/runtime-config";

const EVE_SSO_AUTHORIZE = "https://login.eveonline.com/v2/oauth/authorize/";

/**
 * EVE Online SSO “authorize” URL. Same for main login and additional character linking;
 * the `state` value distinguishes the callback handling.
 *
 * @param {string} state - Where to return afterwards, or an additional-account
 *   handshake (`additional:<nonce>`, see `additionalAccountImport.js`).
 * @returns {string}
 */
export function getEveSsoAuthorizeUrl(state) {
  return `${EVE_SSO_AUTHORIZE}?response_type=code&redirect_uri=${encodeURIComponent(
    getRuntimeEnv("EVE_CALLBACK_URL"),
  )}&client_id=${getRuntimeEnv("EVE_CLIENT_ID")}&scope=${getRuntimeEnv(
    "EVE_SCOPE",
  )}&state=${encodeURIComponent(state)}`;
}

/**
 * EVE echoes `state` back on the callback, and it is checked against the app's routes
 * before a reader is sent anywhere — a damaged one simply lands on the default.
 *
 * @param {string} [returnTo] - Where the reader was headed, when they were sent here
 *   from somewhere other than the page they wanted.
 */
export default function redirectToEveSSO(returnTo) {
  const { pathname, search, hash } = window.location;
  window.location.href = getEveSsoAuthorizeUrl(
    returnTo || `${pathname}${search}${hash}`,
  );
}
