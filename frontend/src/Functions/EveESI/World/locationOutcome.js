import { LOCATION_RESOLUTION_STATUS } from "../../Assets/assetLocationConstants";

/**
 * What asking for a location's name settled on.
 *
 * The distinction the whole segment turns on is between a location that has been *answered for* and
 * one that could not be *asked about*. A refusal is an answer: this character cannot see this
 * structure, and asking again will say the same thing until the account gains a character who can.
 * A failure is not: the token could not be acquired, ESI was down, the request was refused for rate.
 * Ask again and the answer may be a name.
 *
 * A failure is thrown ({@link LocationResolutionError}), never returned, so that nothing upstream
 * can mistake it for a settled result and cache it.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const LOCATION_OUTCOME = Object.freeze({
  /** ESI named it — public, or a character could see it. */
  NAMED: LOCATION_RESOLUTION_STATUS.RESOLVED,
  /** No character could see it; the community store had a name. */
  COMMUNITY: LOCATION_RESOLUTION_STATUS.COMMUNITY,
  /** Every character was refused and the community store had nothing. */
  NO_ACCESS: LOCATION_RESOLUTION_STATUS.NO_ACCESS,
  /**
   * ESI answered, and had no name for this id.
   *
   * Deliberately not `NO_ACCESS`: a station nobody can name is not a place the account cannot see,
   * and the surfaces that dim or drop an unreachable location would be wrong to do either here. It
   * carries no name, so a view falls back to showing the id.
   */
  UNNAMED: "unnamed",
});

/**
 * A location lookup that did not settle.
 *
 * Carries the id it was asking about and, when there was one, the HTTP status — a caller deciding
 * whether to try the next character needs to know a 403 from a 502.
 */
export class LocationResolutionError extends Error {
  /**
   * @param {string} message
   * @param {{locationId?: number, status?: number, characterHash?: string, needsReauthorisation?: boolean, permanent?: boolean, cause?: unknown}} [detail]
   */
  constructor(
    message,
    {
      locationId,
      status,
      characterHash,
      needsReauthorisation,
      permanent,
      cause,
    } = {},
  ) {
    super(message, { cause });
    this.name = "LocationResolutionError";
    this.locationId = locationId;
    this.status = status;
    this.characterHash = characterHash;
    // A character whose token was never granted the scope cannot answer for this location and never
    // will, however many times it is asked — but it has established nothing about the account, so
    // this is not a refusal.
    this.needsReauthorisation = Boolean(needsReauthorisation);
    // The request itself was refused rather than the thing it asked about: the same call will be
    // refused every time, so asking again is waste and the answer will never arrive.
    this.permanent = Boolean(permanent);
  }
}

/**
 * Whether a status means the answer is "you cannot see this", as against "that did not work".
 *
 * 403 is the refusal a structure gives a character without docking rights. 404 is what ESI answers
 * for a structure id it will not resolve for this character at all, which is the same answer from
 * the account's point of view. Everything else — including 420 and 5xx — is a failure.
 *
 * @param {number} status
 * @returns {boolean}
 */
export function isRefusalStatus(status) {
  return status === 403 || status === 404;
}
