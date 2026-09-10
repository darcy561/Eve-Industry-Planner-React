/**
 * Where each blueprint sits.
 *
 * ESI gives a blueprint's holder as a raw id — a station, a ship, or the container it is in — so
 * the place it ends up at is only knowable from the assets, where the same item appears as a node
 * with its chain already resolved. A blueprint the loaded assets do not cover is absent rather than
 * guessed at.
 *
 * @param {import("./buildBlueprintRows").BlueprintCollection} blueprints
 * @param {import("../Assets/buildAssetNodes").AssetCollection} assets
 * @returns {Map<number, number>} blueprint `itemId` to the location id it sits at
 */
export default function blueprintLocations(blueprints, assets) {
  const byItemId = new Map();
  if (!blueprints || !assets) return byItemId;

  for (const row of blueprints.rows) {
    const node = assets.byItemId.get(row.itemId);
    if (node) byItemId.set(row.itemId, node.locationId);
  }

  return byItemId;
}
