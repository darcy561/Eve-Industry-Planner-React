import { LOCATION_KIND } from "./assetLocationConstants";

/**
 * The location kinds a player can be shown as a place to hold or source things from.
 *
 * Asset safety is deliberately absent: items there are held by CONCORD awaiting delivery, not
 * sitting somewhere the player can work from.
 *
 * @type {Set<string>}
 */
const PLACE_KINDS = new Set([
  LOCATION_KIND.STATION,
  LOCATION_KIND.STRUCTURE,
  LOCATION_KIND.SYSTEM,
  LOCATION_KIND.ABYSSAL_SYSTEM,
]);

/**
 * The distinct locations a collection's assets sit at.
 *
 * A node's location is the end of its chain, so a crate three containers deep counts toward the
 * station holding it and appears once.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @returns {number[]} ascending by id; ordering for display is the caller's, once names are known
 */
export default function assetLocationIds(collection) {
  const ids = new Set();

  for (const node of collection?.nodes ?? []) {
    if (PLACE_KINDS.has(node.locationKind)) ids.add(node.locationId);
  }

  return [...ids].sort((a, b) => a - b);
}
