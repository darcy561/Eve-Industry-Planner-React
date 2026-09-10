import { resolveLocationKind } from "./assetLocationConstants";

const OFFICE_FOLDER_FLAG = "OfficeFolder";

/**
 * @typedef {Object} AssetNode
 * @property {number} itemId
 * @property {number} typeId
 * @property {number} quantity
 * @property {string} flag - `location_flag` exactly as ESI gives it
 * @property {number|null} parentId - holding asset's `item_id`, or null when held by a location
 * @property {number[]} childIds - ordered by type then item id; empty for leaves
 * @property {number} locationId - the station, structure or system it ultimately sits in
 * @property {string} locationKind - what that location is; see `LOCATION_KIND`
 * @property {string} rootFlag - the compartment it sits in at that location
 * @property {number} depth - distance from that location
 */

/**
 * @typedef {Object} AssetCollection
 * @property {AssetNode[]} nodes - input order
 * @property {Map<number, AssetNode>} byItemId
 */

/**
 * Normalises raw ESI asset rows into nodes carrying their resolved location and compartment.
 *
 * Pure and synchronous: location and container *names* are resolved elsewhere, so a consumer
 * that only counts quantities never waits on a round trip.
 *
 * @param {Array<Object>} [rows] - raw ESI asset rows
 * @returns {AssetCollection}
 */
export default function buildAssetNodes(rows = []) {
  const byItemId = new Map();
  const nodes = [];

  for (const row of rows) {
    if (!row || row.item_id == null) continue;
    // A corporation's set is the union of its members' views, so the same row arrives once per
    // member that can see it.
    if (byItemId.has(row.item_id)) continue;

    const node = {
      itemId: row.item_id,
      typeId: row.type_id,
      quantity: row.quantity ?? 0,
      flag: row.location_flag,
      parentId: null,
      childIds: [],
      locationId: row.location_id,
      locationKind: resolveLocationKind(row.location_id),
      rootFlag: row.location_flag,
      depth: 0,
    };

    byItemId.set(node.itemId, node);
    nodes.push(node);
  }

  for (const node of nodes) {
    // A holder outside the set is a location: resolution stops there. That is routine rather
    // than an error — a corporation member sees only the offices their roles reach, and a ship
    // flying in space is absent from the set while its fitted modules are not.
    const holder = byItemId.get(node.locationId);
    if (!holder || holder === node) continue;

    node.parentId = holder.itemId;
    holder.childIds.push(node.itemId);
  }

  const resolved = new Set();
  const pending = [];

  for (const node of nodes) {
    if (node.parentId !== null) continue;
    resolved.add(node.itemId);
    pending.push(node);
  }
  descend(pending, byItemId, resolved);

  for (const node of nodes) {
    if (resolved.has(node.itemId)) continue;

    // Only a cyclic chain survives the descent, but an unresolved node may merely hang beneath
    // one. Walk up to the node that closes the cycle and cut there, so a consumer walking
    // parentId upwards terminates without well-formed rows below it losing their holder.
    const seen = new Set([node.itemId]);
    let onCycle = node;
    while (onCycle.parentId !== null && !seen.has(onCycle.parentId)) {
      seen.add(onCycle.parentId);
      onCycle = byItemId.get(onCycle.parentId);
    }

    const holder = byItemId.get(onCycle.parentId);
    holder.childIds = holder.childIds.filter((id) => id !== onCycle.itemId);
    onCycle.parentId = null;

    resolved.add(onCycle.itemId);
    descend([onCycle], byItemId, resolved);
  }

  for (const node of nodes) {
    node.childIds.sort((a, b) => {
      const left = byItemId.get(a);
      const right = byItemId.get(b);
      return left.typeId - right.typeId || left.itemId - right.itemId;
    });
  }

  return { nodes, byItemId };
}

/**
 * Pushes each root's resolved location and compartment down through its descendants.
 *
 * @param {AssetNode[]} queue - roots to descend from; extended in place as children are reached
 * @param {Map<number, AssetNode>} byItemId
 * @param {Set<number>} resolved
 */
function descend(queue, byItemId, resolved) {
  for (let index = 0; index < queue.length; index++) {
    const parent = queue[index];

    for (const childId of parent.childIds) {
      const child = byItemId.get(childId);
      if (resolved.has(child.itemId)) continue;

      child.locationId = parent.locationId;
      child.locationKind = parent.locationKind;
      child.depth = parent.depth + 1;
      // An office folder is a wrapper, not a compartment: the hangar divisions sit inside it, so
      // an item in CorpSAG3 must read CorpSAG3 rather than inheriting OfficeFolder.
      child.rootFlag =
        parent.flag === OFFICE_FOLDER_FLAG ? child.flag : parent.rootFlag;

      resolved.add(child.itemId);
      queue.push(child);
    }
  }
}
