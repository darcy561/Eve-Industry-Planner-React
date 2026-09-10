import { MATERIAL_PLAN } from "./materialSourcingRow";

/**
 * What a build costs, split by what a player is actually paying for.
 *
 * The panel this replaces drew the same five rows twice, once per pricing model,
 * marking neither as the one in effect. This states one set of figures and says
 * what each part of it is.
 */

/**
 * @typedef {object} CostBand
 * @property {Array<{id: string, label: string, value: number}>} lines
 * @property {number} total
 */

/**
 * @typedef {object} CostBreakdown
 * @property {CostBand} toBuild - What it costs to make the thing
 * @property {CostBand} toSell - What it costs to sell it, paid only on listing
 * @property {number} total
 * @property {number} perUnit
 */

/**
 * A material's cost counts once, in the band that reflects how it is sourced.
 *
 * A linked material contributes its child build cost and nothing to the market
 * line: the child's own unit cost replaces the market price rather than adding
 * to it. A material already bought counts what was paid, because that is not an
 * estimate any more.
 *
 * @param {object} params
 * @param {Array<object>} params.rows - Rows from buildMaterialSourcingRow
 * @param {number} params.installCost - This job's own slots
 * @param {number} params.extras
 * @param {number} params.brokerFee - ISK, from brokerFeeAmount
 * @param {number} params.salesTax - ISK, from salesTaxAmount
 * @param {number} params.quantityProduced
 * @returns {CostBreakdown}
 */
export function buildCostBreakdown({
  rows = [],
  installCost = 0,
  extras = 0,
  brokerFee = 0,
  salesTax = 0,
  quantityProduced = 0,
}) {
  let bought = 0;
  let built = 0;
  let paid = 0;

  for (const row of rows) {
    if (row.plan === MATERIAL_PLAN.PAID) {
      paid += row.paidCost ?? 0;
      continue;
    }
    if (row.plan === MATERIAL_PLAN.BUILD && row.buildPrice !== null) {
      built += row.buildPrice * row.quantity;
      continue;
    }
    bought += (row.buyPrice ?? 0) * row.quantity;
  }

  const toBuild = band([
    { id: "bought", label: "Materials bought", value: bought },
    { id: "built", label: "Materials built", value: built },
    { id: "paid", label: "Materials already paid for", value: paid },
    { id: "install", label: "Install cost", value: installCost },
    { id: "extras", label: "Extras", value: extras },
  ]);

  const toSell = band([
    { id: "brokerFee", label: "Broker fee", value: brokerFee },
    { id: "salesTax", label: "Sales tax", value: salesTax },
  ]);

  const total = toBuild.total + toSell.total;

  return {
    toBuild,
    toSell,
    total,
    // A job producing nothing has no per-unit cost rather than an infinite one.
    perUnit: quantityProduced > 0 ? total / quantityProduced : 0,
  };
}

/**
 * Drops the lines that are nothing, so a breakdown states what it is made of
 * rather than listing every part a build could have had.
 *
 * @param {Array<{id: string, label: string, value: number}>} lines
 * @returns {CostBand}
 */
function band(lines) {
  const present = lines.filter((line) => line.value > 0);

  return {
    lines: present,
    total: present.reduce((sum, line) => sum + line.value, 0),
  };
}
