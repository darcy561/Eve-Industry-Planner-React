/**
 * Shared helpers for selects aligned with the account's pricing default for the
 * side of a job they price.
 */

/**
 * When the chosen id equals the canonical application default, return `undefined` so callers can drop a redundant override.
 *
 * @param {string} chosenId
 * @param {string | null | undefined} canonicalApplicationDefault
 * @param {string} configFallback — `GLOBAL_CONFIG.DEFAULT_*` when store value missing
 * @returns {string | undefined}
 */
export function normalizedOverrideWhenMatchesDefault(
  chosenId,
  canonicalApplicationDefault,
  configFallback,
) {
  const canon = canonicalApplicationDefault ?? configFallback;
  return chosenId === canon ? undefined : chosenId;
}
