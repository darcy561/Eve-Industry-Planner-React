import { listingType } from "../../Context/defaultValues";
import { MATERIAL_PLAN } from "./materialSourcingRow";

/**
 * How a material row is priced on the Planning stage: what the job's materials
 * would cost on each pricing basis, and whether a row is still an estimate at all.
 */

/**
 * Which hub and basis apply to one material row.
 *
 * A row's own override outranks the panel default on each axis independently, so
 * a row can name a hub without naming a basis. This is the one place that rule
 * lives; a second copy of it would let a quoted total disagree with the row it
 * quotes.
 *
 * @param {object} layout - The job's layout, holding materialPriceOverrides
 * @param {number} materialTypeID
 * @param {string} defaultMarketSelect
 * @param {string} defaultListingSelect
 * @returns {{marketSelect: string, listingSelect: string}}
 */
export function getEffectiveMaterialPriceHub(
  layout,
  materialTypeID,
  defaultMarketSelect,
  defaultListingSelect
) {
  const override = layout?.materialPriceOverrides?.[materialTypeID];

  return {
    marketSelect: override?.marketDisplay ?? defaultMarketSelect,
    listingSelect: override?.orderDisplay ?? defaultListingSelect,
  };
}

/**
 * @typedef {object} BasisOption
 * @property {string} id - One of the listingType ids
 * @property {string} label - Display name
 * @property {number} total - What the job's materials cost on this basis
 * @property {number} delta - That total less the current basis's total
 * @property {boolean} isCurrent - Whether this is the basis in effect
 */

/**
 * What the job's materials cost on each of the four bases, so a player choosing
 * one sees its effect rather than a label.
 *
 * A material carrying its own override keeps it on every basis: the picker sets
 * the panel's default, and an override outranks the default, so a total that
 * ignored overrides would not be the total the player would get.
 *
 * @param {object} params
 * @param {Array<object>} params.materials - The job's materials
 * @param {object} params.layout - The job's layout, holding materialPriceOverrides
 * @param {string} params.marketSelect - The hub in effect
 * @param {string} params.listingSelect - The basis in effect
 * @param {(typeID: number, hub: string, basis: string) => number} params.getPrice
 * @returns {BasisOption[]}
 */
export function materialCostByBasis({
  materials,
  layout,
  marketSelect,
  listingSelect,
  getPrice,
}) {
  const rows = Array.isArray(materials) ? materials : [];

  const totalOn = (basis) =>
    rows.reduce((total, material) => {
      const resolved = getEffectiveMaterialPriceHub(
        layout,
        material.typeID,
        marketSelect,
        basis
      );
      const price = getPrice(
        material.typeID,
        resolved.marketSelect,
        resolved.listingSelect
      );
      return total + price * material.quantity;
    }, 0);

  const totalsById = new Map(
    listingType.map((entry) => [entry.id, totalOn(entry.id)])
  );
  const current = totalsById.get(listingSelect) ?? 0;

  return listingType.map((entry) => {
    const total = totalsById.get(entry.id) ?? 0;
    return {
      id: entry.id,
      label: entry.name,
      caption: entry.caption,
      description: entry.description,
      total,
      delta: total - current,
      isCurrent: entry.id === listingSelect,
    };
  });
}

/**
 * How many rows are not on the panel's basis, and how many are not estimates at
 * all.
 *
 * An override is otherwise invisible: a row priced against a different hub looks
 * like any other, and the panel it replaced hid the whole list of them behind a
 * dialogue. Counting departures makes one discoverable without opening anything.
 *
 * @param {Array<object>} rows - Rows from buildMaterialSourcingRow
 * @param {string} marketSelect - The panel's hub
 * @param {string} listingSelect - The panel's basis
 * @returns {{overridden: number, purchased: number}}
 */
export function summariseBasisUse(rows, marketSelect, listingSelect) {
  const list = Array.isArray(rows) ? rows : [];

  return {
    overridden: list.filter(
      (row) =>
        (row.marketSelect && row.marketSelect !== marketSelect) ||
        (row.listingSelect && row.listingSelect !== listingSelect)
    ).length,
    purchased: list.filter((row) => row.plan === MATERIAL_PLAN.PAID).length,
  };
}

/**
 * @typedef {object} MaterialPurchaseState
 * @property {'paid'|'part-paid'|'estimated'} kind
 * @property {number} paidCost - What the job is charged for what was bought
 * @property {number} paidQuantity - How many of the requirement that covered
 * @property {number} remainingQuantity - How many are still to buy
 */

/**
 * Whether a row is still an estimate, or reports what was actually paid.
 *
 * A material bought in full is not a price the app should guess at — the player
 * has the receipt. One bought in part is both: what was paid, and an estimate for
 * the rest.
 *
 * @param {object} material - A JobMaterial instance; its totals are getters, so a
 *   spread of one loses them and must not be passed here
 * @returns {MaterialPurchaseState}
 */
export function materialPurchaseState(material) {
  const paidQuantity = material?.quantityPurchased ?? 0;
  const paidCost = material?.purchasedCost ?? 0;
  const required = material?.quantity ?? 0;
  const remainingQuantity = Math.max(0, required - paidQuantity);

  if (material?.purchaseComplete) {
    return { kind: "paid", paidCost, paidQuantity, remainingQuantity: 0 };
  }
  if (paidQuantity > 0) {
    return { kind: "part-paid", paidCost, paidQuantity, remainingQuantity };
  }
  return { kind: "estimated", paidCost: 0, paidQuantity: 0, remainingQuantity };
}
