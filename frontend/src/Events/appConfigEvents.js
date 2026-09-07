import { eventEmitter, subscribeToEvent } from "../utils/EventSystem";

const APP_CONFIG_RECHECK_EVENT = "appConfigRecheckRequested";

/**
 * Asks app-config to re-read itself now: a call refused for maintenance, or a
 * socket that would not reconnect.
 *
 * @returns {void}
 */
export function requestAppConfigRecheck() {
  eventEmitter.emit(APP_CONFIG_RECHECK_EVENT);
}

/**
 * @param {() => void} callback
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToAppConfigRecheck(callback) {
  return subscribeToEvent(APP_CONFIG_RECHECK_EVENT, callback);
}
