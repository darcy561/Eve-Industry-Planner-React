/**
 * The icon EVE serves for what a node is.
 *
 * @param {import("./buildAssetNodes").AssetNode} node
 * @returns {string}
 */
export function assetImageUrl(node) {
  return `https://images.evetech.net/types/${node.typeId}/icon?size=32`;
}

/**
 * What a node is called: the item's name, the player's name for it when it carries one, and the
 * compartment it sits in when that needs saying — a corporation's hangar division, which the
 * division's own name gives.
 *
 * @param {import("./buildAssetNodes").AssetNode} node
 * @param {Object<string, {name: string}>} [fullItemList]
 * @param {Map<number, {name: string}>} [containerNames]
 * @param {string} [compartmentName]
 * @returns {string}
 */
export function assetName(node, fullItemList = {}, containerNames, compartmentName) {
  const itemName =
    fullItemList[node.typeId]?.name ?? `Unknown Item - ${node.typeId}`;
  const givenName = containerNames?.get(node.itemId)?.name;

  return [compartmentName, itemName, givenName].filter(Boolean).join(" - ");
}

/**
 * What a location picker says when it has nothing to offer: still looking, unable to look, or
 * nothing there. Without the distinction a failed lookup reads as an account holding nothing.
 *
 * @param {{count: number, isLoading: boolean, isError: boolean}} state
 * @returns {string}
 */
export function locationPickerLabel({ count, isLoading, isError }) {
  if (count > 0) return "Select location";
  if (isLoading) return "Finding locations…";
  if (isError) return "Locations unavailable";
  return "No locations found";
}
