/**
 * The planner the app is working in, as an owner handle.
 */

/**
 * @param {string} accountID
 * @returns {string} an owner handle, or "" with no account to name
 */
export function accountOwnerHandle(accountID) {
  return accountID ? `account:${accountID}` : "";
}

/**
 * @returns {object} Default active planner slice state
 */
export const stateDefault = () => ({
  /** @type {string|null} owner handle, or null when no planner has been named */
  owner: null,
});
