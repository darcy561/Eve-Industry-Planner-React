/**
 * The SDE inventory categories the SPA asks an item about.
 *
 * A type's category arrives on the static item list as `category_id`. It is absent for a type the
 * list does not carry and for a build of the static data older than the field, so a reading of it
 * is always "this is a ship" or "nothing said" — never "this is not a ship".
 *
 * @type {Readonly<Record<string, number>>}
 */
export const ITEM_CATEGORY = Object.freeze({
  SHIP: 6,
  /**
   * Sleeper relics, the inputs to tech three invention. ESI returns them from the *blueprints*
   * endpoint rather than as plain assets, because they carry runs the way a copy does — but they
   * are materials a player buys and holds, and EVE draws them from their own image variant.
   */
  ANCIENT_RELIC: 34,
});

/**
 * The image variant EVE serves for a type.
 *
 * A relic is served only as `relic`: asking for its `icon`, `bp` or `bpc` is answered with a 400
 * and no image.
 *
 * @param {number|undefined} categoryId
 * @returns {boolean}
 */
export function isAncientRelic(categoryId) {
  return categoryId === ITEM_CATEGORY.ANCIENT_RELIC;
}
