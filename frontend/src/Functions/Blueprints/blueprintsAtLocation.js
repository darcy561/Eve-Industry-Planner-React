/**
 * The blueprints held at one location.
 *
 * A blueprint the loaded assets do not place is left out rather than kept: the library is being
 * asked what is at a location, and an unplaced blueprint is not an answer to that.
 *
 * @param {Array<import("./buildBlueprintRows").BlueprintRow>} rows
 * @param {Map<number, number>} locationIds - blueprint `itemId` to the location it sits at
 * @param {number} [locationId] - when absent, every row is offered
 * @returns {Array<import("./buildBlueprintRows").BlueprintRow>}
 */
export default function blueprintsAtLocation(
  rows = [],
  locationIds,
  locationId,
) {
  if (!locationId) return rows;

  return rows.filter((row) => locationIds?.get(row.itemId) === locationId);
}
