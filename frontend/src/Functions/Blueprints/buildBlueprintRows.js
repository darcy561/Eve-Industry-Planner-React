const BLUEPRINT_COPY_QUANTITY = -2;

/**
 * Which kind of holder a blueprint belongs to.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const BLUEPRINT_OWNER = Object.freeze({
  CHARACTER: "character",
  CORPORATION: "corporation",
});

/**
 * @typedef {Object} BlueprintRow
 * @property {number} itemId
 * @property {number} typeId
 * @property {number} me - material efficiency level; always 0 for a reaction formula
 * @property {number} te - time efficiency level; always 0 for a reaction formula
 * @property {number} runs - runs remaining on a copy, -1 on an original or a reaction formula
 * @property {number} quantity - ESI's raw quantity; -1 an original, -2 a copy, positive a stack
 * @property {boolean} isCopy
 * @property {number} originalCount - originals this row represents; 0 for a copy
 * @property {string} ownerType - see {@link BLUEPRINT_OWNER}
 * @property {string|number|null} ownerId - CharacterHash, or corporation id
 * @property {number} locationId - raw holder; a station, a ship, or a container's item_id
 * @property {string} flag - `location_flag` exactly as ESI gives it
 * @property {number|null} productTypeId - what this blueprint builds, null when unknown
 * @property {number|null} jobType - `jobTypes` value for that product, null when unknown
 */

/**
 * @typedef {Object} BlueprintCollection
 * @property {BlueprintRow[]} rows - input order
 * @property {Map<number, BlueprintRow>} byItemId
 * @property {Map<number, BlueprintRow[]>} byTypeId
 */

/**
 * Normalises raw ESI blueprint rows, resolving each row's product and job type against the search
 * index so that no consumer redoes that join.
 *
 * `locationId` stays the raw holder. ESI documents it as a station, a ship, or a container's
 * `item_id`, so turning it into a place needs the asset collection — a cross-read done where the
 * two are displayed together, not a build-time dependency.
 *
 * Unlike the asset builder this does not collapse repeated `item_id`s. A corporation's blueprint
 * list is a single access point returning the same rows to every authorised character, so repeats
 * mean the collection was fetched once per character instead of once per corporation. Hiding that
 * here would leave the duplicate fetches in place.
 *
 * @param {Array<Object>} [rows] - raw ESI blueprint rows
 * @param {Array<{blueprintID: number, itemID: number, jobType: number}>} [searchIndex]
 * @returns {BlueprintCollection}
 */
export default function buildBlueprintRows(rows = [], searchIndex = []) {
  const productByBlueprintTypeId = new Map();
  for (const entry of searchIndex) {
    if (!entry || entry.blueprintID == null) continue;
    if (productByBlueprintTypeId.has(entry.blueprintID)) continue;
    productByBlueprintTypeId.set(entry.blueprintID, entry);
  }

  const built = [];
  const byItemId = new Map();
  const byTypeId = new Map();

  for (const row of rows) {
    if (!row || row.item_id == null) continue;

    const quantity = row.quantity ?? -1;
    const isCopy = quantity === BLUEPRINT_COPY_QUANTITY;
    const isCorporation = Boolean(row.is_corporation);
    const product = productByBlueprintTypeId.get(row.type_id);

    const blueprint = {
      itemId: row.item_id,
      typeId: row.type_id,
      me: row.material_efficiency ?? 0,
      te: row.time_efficiency ?? 0,
      runs: row.runs ?? -1,
      quantity,
      isCopy,
      // A positive quantity is a stack of interchangeable originals, each able to carry its own
      // job, so counting rows undercounts the slots available. Manufacturing originals reach that
      // state only fresh from the market, because research and job history make them unstackable;
      // reaction formulas carry no such state and restack after every use, so for them a stack is
      // the everyday condition rather than an edge case.
      originalCount: isCopy ? 0 : Math.max(quantity, 1),
      ownerType: isCorporation
        ? BLUEPRINT_OWNER.CORPORATION
        : BLUEPRINT_OWNER.CHARACTER,
      ownerId: isCorporation
        ? row.corporation_id ?? null
        : row.CharacterHash ?? null,
      locationId: row.location_id,
      flag: row.location_flag,
      productTypeId: product?.itemID ?? null,
      jobType: product?.jobType ?? null,
    };

    built.push(blueprint);
    byItemId.set(blueprint.itemId, blueprint);

    const sameType = byTypeId.get(blueprint.typeId);
    if (sameType) {
      sameType.push(blueprint);
    } else {
      byTypeId.set(blueprint.typeId, [blueprint]);
    }
  }

  for (const group of byTypeId.values()) {
    // Originals lead, then the most efficient of each kind — the order the job setup helpers and
    // the library both want, decided once rather than by a comparator on stringified quantities.
    group.sort(
      (a, b) =>
        Number(a.isCopy) - Number(b.isCopy) || b.me - a.me || b.te - a.te
    );
  }

  return { rows: built, byItemId, byTypeId };
}
