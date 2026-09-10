import { OFFICE_FOLDER_FLAG } from "./buildAssetNodes";
import { isNoAccessLocation } from "./assetLocationConstants";

/**
 * Whether a node is one of the rows shown directly under a location or compartment.
 *
 * An office folder is a wrapper rather than a row of its own, so the hangar divisions inside it
 * read as top rows the way a station's hangar contents do.
 *
 * @param {import("./buildAssetNodes").AssetNode} node
 * @param {Map<number, import("./buildAssetNodes").AssetNode>} byItemId
 * @returns {boolean}
 */
function isTopRow(node, byItemId) {
  if (node.flag === OFFICE_FOLDER_FLAG) return false;
  if (node.parentId === null) return true;
  return byItemId.get(node.parentId)?.flag === OFFICE_FOLDER_FLAG;
}

/**
 * The top rows at each location, keyed by location id.
 *
 * Narrowing is on `rootFlag`, the compartment a node sits in at its location, so a crate in
 * Deliveries and everything inside it belong to Deliveries together. The raw `location_flag` cannot
 * do this: a stack inside that crate carries `Unlocked` like any other container's contents.
 *
 * `includeLocations` names locations that belong in the answer whether or not anything is at them:
 * a corporation renting an office it has emptied still rents it. `excludeItemIds` drops individual
 * items, which is how the asset views leave blueprints out.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @param {{rootFlags?: Iterable<string>, excludeRootFlags?: Iterable<string>, includeLocations?: Iterable<number>, excludeItemIds?: Set<number>}} [narrow]
 * @returns {Map<number, Array<import("./buildAssetNodes").AssetNode>>}
 */
export function assetRowsByLocation(
  collection,
  { rootFlags, excludeRootFlags, includeLocations, excludeItemIds } = {}
) {
  const byLocation = new Map();

  for (const locationId of includeLocations ?? []) {
    byLocation.set(locationId, []);
  }

  if (!collection) return byLocation;

  const wanted = rootFlags ? new Set(rootFlags) : null;
  const unwanted = excludeRootFlags ? new Set(excludeRootFlags) : null;

  for (const node of collection.nodes) {
    if (!isTopRow(node, collection.byItemId)) continue;
    if (wanted && !wanted.has(node.rootFlag)) continue;
    if (unwanted && unwanted.has(node.rootFlag)) continue;
    if (excludeItemIds?.has(node.itemId)) continue;

    const held = byLocation.get(node.locationId);
    if (held) {
      held.push(node);
    } else {
      byLocation.set(node.locationId, [node]);
    }
  }

  return byLocation;
}

/**
 * A location's rows split by the compartment they sit in.
 *
 * @param {Array<import("./buildAssetNodes").AssetNode>} rows
 * @returns {Map<string, Array<import("./buildAssetNodes").AssetNode>>}
 */
export function rowsByCompartment(rows = []) {
  const byFlag = new Map();

  for (const node of rows) {
    const held = byFlag.get(node.rootFlag);
    if (held) {
      held.push(node);
    } else {
      byFlag.set(node.rootFlag, [node]);
    }
  }

  return byFlag;
}

/**
 * Nodes ordered by the name of what they are.
 *
 * Returns a new array: the collection is shared by every consumer of the scope, so sorting one of
 * its rows in place would reorder it for all of them.
 *
 * @param {Array<import("./buildAssetNodes").AssetNode>} nodes
 * @param {Object<string, {name: string}>} [fullItemList]
 * @returns {Array<import("./buildAssetNodes").AssetNode>}
 */
export function sortNodesByName(nodes = [], fullItemList = {}) {
  return [...nodes].sort((a, b) => {
    const left = fullItemList[a.typeId]?.name;
    const right = fullItemList[b.typeId]?.name;
    if (!left || !right) return 0;
    return left.localeCompare(right);
  });
}

/**
 * The item ids worth asking ESI for a player-given name.
 *
 * Only a container can carry one, and a node holding nothing is not a container.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @returns {number[]}
 */
export function namedContainerIds(collection) {
  const ids = [];

  for (const node of collection?.nodes ?? []) {
    if (node.childIds.length > 0 && node.flag !== OFFICE_FOLDER_FLAG) {
      ids.push(node.itemId);
    }
  }

  return ids;
}

/**
 * The locations a corporation rents an office at, as its assets show them.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @returns {number[]}
 */
export function officeLocationIds(collection) {
  const ids = new Set();

  for (const node of collection?.nodes ?? []) {
    if (node.flag === OFFICE_FOLDER_FLAG) ids.add(node.locationId);
  }

  return [...ids];
}

/**
 * Locations in the order they are shown: by name, the unnamed after them, and the ones the account
 * cannot read last. A location whose name has not resolved keeps its place — it is still where the
 * assets are.
 *
 * @param {Iterable<[number, T]>} entries - location id and whatever is at it
 * @param {Object<string, {name: string}>} names
 * @returns {Array<{locationId: number, name: string, unreadable: boolean, rows: T}>}
 * @template T
 */
export function orderLocations(entries, names) {
  return [...entries]
    .map(([locationId, rows]) => ({
      locationId,
      name: names[locationId]?.name ?? "",
      unreadable: isNoAccessLocation(names[locationId]),
      rows,
    }))
    .sort((a, b) => {
      if (a.unreadable !== b.unreadable) return a.unreadable ? 1 : -1;
      if (!a.name || !b.name) return a.name ? -1 : b.name ? 1 : 0;
      return a.name.localeCompare(b.name);
    });
}
