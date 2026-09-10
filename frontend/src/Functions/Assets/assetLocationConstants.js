/**
 * Constants for EVE Online asset location types and flags.
 *
 * These constants define which location types and flags are accepted
 * when processing and organising EVE Online assets.
 */

/**
 * Set of direct location types that can be used directly without parent lookup.
 * These are top-level locations like stations and solar systems.
 *
 * @type {Set<string>}
 */
export const acceptedDirectLocationTypes = new Set(["station", "solar_system"]);

/**
 * Set of extended location types that require parent lookup.
 * These are nested locations like items and other container types.
 *
 * @type {Set<string>}
 */
export const acceptedExtendedLocationTypes = new Set(["item", "other"]);

/**
 * Set of accepted location flags for assets.
 * These flags indicate where assets are stored within a location (e.g., Hangar, CorpSAG1-7).
 *
 * @type {Set<string>}
 */
export const acceptedLocationFlags = new Set([
  "Hangar",
  "Unlocked",
  "AutoFit",
  "CorpSAG1",
  "CorpSAG2",
  "CorpSAG3",
  "CorpSAG4",
  "CorpSAG5",
  "CorpSAG6",
  "CorpSAG7",
  "CorporationGoalDeliveries",
]);

/**
 * Prefix used for unresolved/inaccessible location names.
 * Some values include a suffix (e.g. " - <id>"), so callers should use the helper below.
 *
 * @type {string}
 */
export const NO_ACCESS_LOCATION_NAME_PREFIX = "No Access To Location";
export const LOCATION_RESOLUTION_STATUS = {
  RESOLVED: "resolved",
  COMMUNITY: "community",
  NO_ACCESS: "no_access",
};

/**
 * Returns true when a location name represents an inaccessible location.
 *
 * @param {string | undefined | null} name
 * @returns {boolean}
 */
export function isNoAccessLocationName(name) {
  return (
    typeof name === "string" && name.startsWith(NO_ACCESS_LOCATION_NAME_PREFIX)
  );
}

/**
 * Returns true when the location object represents an inaccessible location.
 * Supports both new structured fields and legacy name-only entries.
 *
 * @param {{ name?: string, resolutionStatus?: string } | null | undefined} location
 * @returns {boolean}
 */
export function isNoAccessLocation(location) {
  if (!location || typeof location !== "object") return false;
  if (location.resolutionStatus === LOCATION_RESOLUTION_STATUS.NO_ACCESS) {
    return true;
  }
  return isNoAccessLocationName(location.name);
}


/**
 * Sentinel location an item sits at once it has been moved to asset safety.
 *
 * @type {number}
 */
export const ASSET_SAFETY_LOCATION_ID = 2004;

/**
 * What a resolved `location_id` refers to.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const LOCATION_KIND = Object.freeze({
  ASSET_SAFETY: "assetSafety",
  SYSTEM: "system",
  ABYSSAL_SYSTEM: "abyssalSystem",
  STATION: "station",
  STRUCTURE: "structure",
});

/**
 * Classifies a location id by its range, per ESI's asset location_id reference.
 *
 * A row's `location_type` cannot do this on its own: a player structure arrives as `"item"`, the
 * same value a container carries, so telling them apart means walking the chain to find where it
 * ends. The range answers it from the id alone. Customs offices share the structure range and are
 * not separable here. `SYSTEM` deliberately spans two documented ranges — New Eden systems and
 * wormhole systems — because an asset in space sits in one the same way it sits in the other.
 *
 * @param {number} locationId
 * @returns {string} one of {@link LOCATION_KIND}
 */
export function resolveLocationKind(locationId) {
  if (locationId === ASSET_SAFETY_LOCATION_ID) return LOCATION_KIND.ASSET_SAFETY;
  if (locationId >= 30000000 && locationId < 32000000) return LOCATION_KIND.SYSTEM;
  if (locationId >= 32000000 && locationId < 33000000) {
    return LOCATION_KIND.ABYSSAL_SYSTEM;
  }
  if (locationId >= 60000000 && locationId < 64000000) return LOCATION_KIND.STATION;
  return LOCATION_KIND.STRUCTURE;
}
