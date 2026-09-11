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
  REGION: "region",
  CONSTELLATION: "constellation",
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
 * Regions and constellations never arrive as an asset's location, but they do reach name
 * resolution — a market history reads a region. They are classified here rather than falling to the
 * `STRUCTURE` default, which would send them to an endpoint that answers for neither.
 *
 * @param {number} locationId
 * @returns {string} one of {@link LOCATION_KIND}
 */
export function resolveLocationKind(locationId) {
  if (locationId === ASSET_SAFETY_LOCATION_ID) return LOCATION_KIND.ASSET_SAFETY;
  if (locationId >= 10000000 && locationId < 13000000) return LOCATION_KIND.REGION;
  if (locationId >= 20000000 && locationId < 23000000) {
    return LOCATION_KIND.CONSTELLATION;
  }
  if (locationId >= 30000000 && locationId < 32000000) return LOCATION_KIND.SYSTEM;
  if (locationId >= 32000000 && locationId < 33000000) {
    return LOCATION_KIND.ABYSSAL_SYSTEM;
  }
  if (locationId >= 60000000 && locationId < 64000000) return LOCATION_KIND.STATION;
  return LOCATION_KIND.STRUCTURE;
}
