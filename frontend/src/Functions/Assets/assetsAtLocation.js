/**
 * The assets sitting at one location, grouped by what they are.
 *
 * A node's `locationId` is the place its chain ends at, so everything inside a container there is
 * already accounted for without descending into it.
 *
 * A compartment narrows it further — a corporation hangar division, or Deliveries. That is the
 * node's `rootFlag`, which every node beneath a compartment carries, so a crate's contents in
 * hangar three count toward hangar three.
 *
 * @param {import("./buildAssetNodes").AssetCollection} collection
 * @param {number} locationId
 * @param {string} [rootFlag] - the compartment at that location
 * @returns {Map<number, Array<import("./buildAssetNodes").AssetNode>>} keyed by `typeId`
 */
export default function assetsAtLocation(collection, locationId, rootFlag) {
  const byTypeId = new Map();
  if (!collection || !locationId) return byTypeId;

  for (const node of collection.nodes) {
    if (node.locationId !== locationId) continue;
    if (rootFlag && node.rootFlag !== rootFlag) continue;

    const held = byTypeId.get(node.typeId);
    if (held) {
      held.push(node);
    } else {
      byTypeId.set(node.typeId, [node]);
    }
  }

  return byTypeId;
}
