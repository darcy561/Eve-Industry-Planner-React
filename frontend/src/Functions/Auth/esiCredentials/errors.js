/**
 * Failure classes for ESI credential acquisition. Callers branch on the class, not on the message:
 * only the storage strategy knows what a given failure means for its own material.
 */
export const ESI_CREDENTIAL_RECOVERABLE = "recoverable";
export const ESI_CREDENTIAL_REAUTH_REQUIRED = "reauth_required";

export class EsiCredentialError extends Error {
  /**
   * @param {string} message
   * @param {string} classification - {@link ESI_CREDENTIAL_RECOVERABLE} or {@link ESI_CREDENTIAL_REAUTH_REQUIRED}
   * @param {object} [options]
   * @param {unknown} [options.cause]
   */
  constructor(message, classification, options = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "EsiCredentialError";
    this.classification = classification;
  }
}

/** @param {unknown} err */
export function isReauthRequired(err) {
  return err instanceof EsiCredentialError &&
    err.classification === ESI_CREDENTIAL_REAUTH_REQUIRED;
}
