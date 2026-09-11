import { OFFICE_FOLDER_FLAG } from "./buildAssetNodes";

/**
 * @typedef {Object} AssetBranch
 * @property {import("./buildAssetNodes").AssetNode} node
 * @property {AssetBranch[]} children - empty for a stack, the contents worth showing for a container
 */

/**
 * Where a type is held, and what holds it.
 *
 * Everything on a path to a matching stack is kept — the containers above it, so the player can see
 * which crate to open, and everything inside a match, because a matched container's contents are
 * part of what they were shown. Anything else at the location is left out.
 *
 * An office folder is read through rather than shown, so a corporation's hangar division reads as
 * the row it holds.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @param {number} typeId
 * @returns {Map<number, AssetBranch[]>} keyed by location id
 */
export default function assetsOfType(collection, typeId) {
  const byLocation = new Map();
  if (!collection || !typeId) return byLocation;

  const keep = new Set();

  for (const node of collection.nodes) {
    if (node.typeId !== typeId) continue;

    for (
      let held = node;
      held && !keep.has(held.itemId);
      held = collection.byItemId.get(held.parentId)
    ) {
      keep.add(held.itemId);
    }
    descend(node, collection, keep);
  }

  for (const node of collection.nodes) {
    if (!keep.has(node.itemId)) continue;
    if (!isBranchRoot(node, collection)) continue;

    const held = byLocation.get(node.locationId);
    const branch = buildBranch(node, collection, keep);
    if (held) {
      held.push(branch);
    } else {
      byLocation.set(node.locationId, [branch]);
    }
  }

  return byLocation;
}

function isBranchRoot(node, collection) {
  if (node.flag === OFFICE_FOLDER_FLAG) return false;
  if (node.parentId === null) return true;
  return collection.byItemId.get(node.parentId)?.flag === OFFICE_FOLDER_FLAG;
}

function descend(node, collection, keep) {
  for (const childId of node.childIds) {
    if (keep.has(childId)) continue;
    keep.add(childId);
    descend(collection.byItemId.get(childId), collection, keep);
  }
}

function buildBranch(node, collection, keep) {
  return {
    node,
    children: node.childIds
      .filter((childId) => keep.has(childId))
      .map((childId) =>
        buildBranch(collection.byItemId.get(childId), collection, keep),
      ),
  };
}
