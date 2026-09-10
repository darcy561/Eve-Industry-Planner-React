import { MATERIAL_PLAN } from "./materialSourcingRow";

/**
 * What a build costs, split by what a player is actually paying for.
 *
 * The panel this replaces drew the same five rows twice, once per pricing model,
 * marking neither as the one in effect. This states one set of figures and says
 * what each part of it is.
 */

/**
 * @typedef {object} CostLine
 * @property {string} id
 * @property {string} label
 * @property {string} [detail] - What the figure is made of, in words
 * @property {number} value
 * @property {number|null} perUnit - Its share of one unit produced
 */

/**
 * @typedef {object} CostBand
 * @property {CostLine[]} lines
 * @property {number} total
 * @property {number|null} perUnit
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
 * @param {{brokerFee?: string, salesTax?: string}} [params.sellDetail] - The rates
 *   behind the two selling figures, in words
 * @returns {CostBreakdown}
 */
export function buildCostBreakdown({
  rows = [],
  installCost = 0,
  extras = 0,
  brokerFee = 0,
  salesTax = 0,
  quantityProduced = 0,
  sellDetail = {},
}) {
  let bought = 0;
  let built = 0;
  let paid = 0;

  for (const row of rows) {
    // What was already spent is spent whatever the row's plan is, and only what
    // is left counts as still to source. A material bought in part was
    // otherwise losing its paid half and being estimated for units nobody is
    // going to buy.
    paid += row.paidCost ?? 0;

    const remaining = row.remainingQuantity ?? row.quantity;
    if (remaining <= 0) continue;

    if (row.plan === MATERIAL_PLAN.BUILD) {
      built += (row.buildPrice ?? 0) * remaining;
      continue;
    }
    bought += (row.buyPrice ?? 0) * remaining;
  }

  const counts = countRows(rows);

  const each = (value) => (quantityProduced > 0 ? value / quantityProduced : null);

  const toBuild = band(each, [
    {
      id: "bought",
      label: "Materials bought at market",
      detail: materialsDetail(counts),
      value: bought,
    },
    {
      id: "built",
      label: "Child job builds",
      detail: "their materials and install, not counted above",
      value: built,
    },
    {
      id: "paid",
      label: "Materials already bought",
      detail: `${counts.paid} of ${counts.total} at what you paid`,
      value: paid,
    },
    { id: "install", label: "Install cost", detail: "this job only", value: installCost },
    { id: "extras", label: "Extras", value: extras },
  ]);

  const toSell = band(each, [
    {
      id: "brokerFee",
      label: "Broker fee to list",
      detail: sellDetail.brokerFee,
      value: brokerFee,
    },
    {
      id: "salesTax",
      label: "Sales tax",
      detail: sellDetail.salesTax,
      value: salesTax,
    },
  ]);

  const total = toBuild.total + toSell.total;

  return {
    toBuild,
    toSell,
    total,
    // A job producing nothing has no per-unit cost rather than an infinite one.
    perUnit: each(total),
  };
}

/**
 * @param {Array<object>} rows
 * @returns {{total: number, bought: number, built: number, paid: number}}
 */
function countRows(rows) {
  const counts = { total: rows.length, bought: 0, built: 0, paid: 0 };
  for (const row of rows) {
    if (row.plan === MATERIAL_PLAN.PAID) counts.paid += 1;
    else if (row.plan === MATERIAL_PLAN.BUILD) counts.built += 1;
    else counts.bought += 1;
  }
  return counts;
}

/**
 * Says how much of the list this line covers, since the figure alone does not.
 *
 * @param {{total: number, bought: number, built: number}} counts
 * @returns {string}
 */
function materialsDetail({ total, bought, built }) {
  const of = `${bought} of ${total}`;
  return built > 0 ? `${of} · ${built} replaced by child builds` : of;
}

/**
 * Drops the lines that are nothing, so a breakdown states what it is made of
 * rather than listing every part a build could have had.
 *
 * @param {(value: number) => number|null} each
 * @param {Array<{id: string, label: string, value: number}>} lines
 * @returns {CostBand}
 */
function band(each, lines) {
  const present = lines
    .filter((line) => line.value > 0)
    .map((line) => ({ ...line, perUnit: each(line.value) }));
  const total = present.reduce((sum, line) => sum + line.value, 0);

  return { lines: present, total, perUnit: each(total) };
}
