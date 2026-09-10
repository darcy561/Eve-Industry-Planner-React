/**
 * What a build returns, by each route out.
 *
 * States figures and the relationships between them and no verdict. Whether a
 * margin is worth the time depends on a player's capital, their week and the
 * item's turnover, none of which the app holds.
 */

/**
 * @typedef {object} ExitRoute
 * @property {string} id
 * @property {string} label
 * @property {number} revenue - Before what selling costs
 * @property {number} net - After it
 */

/**
 * @typedef {object} Returns
 * @property {number} net - What is left after everything
 * @property {number} perUnit
 * @property {number|null} margin - Net over revenue, as a fraction
 * @property {number|null} returnOnOutlay - Net over what it cost, as a fraction
 * @property {ExitRoute[]} routes
 * @property {number|null} breakEvenPerUnit - What each unit must fetch to cover the build
 */

/**
 * Both exit routes at the price the market is now.
 *
 * Listing a sell order returns the hub sell price less fee and tax; selling into
 * buy orders returns the buy price less tax only, because nothing is listed. The
 * app does not model undercutting, order-book position, or how long a listing
 * sits.
 *
 * @param {object} params
 * @param {number} params.sellPrice - Unit price listing into the sell side
 * @param {number} params.buyPrice - Unit price selling into buy orders
 * @param {number} params.quantityProduced
 * @param {number} params.buildCost - What making it cost, selling excluded
 * @param {number} params.brokerFee - ISK, charged only on a listing
 * @param {number} params.salesTax - ISK, charged on either route
 * @returns {Returns}
 */
export function calculateReturns({
  sellPrice = 0,
  buyPrice = 0,
  quantityProduced = 0,
  buildCost = 0,
  brokerFee = 0,
  salesTax = 0,
}) {
  const listedRevenue = sellPrice * quantityProduced;
  const immediateRevenue = buyPrice * quantityProduced;

  const routes = [
    {
      id: "listed",
      label: "Sell order",
      revenue: listedRevenue,
      net: listedRevenue - brokerFee - salesTax - buildCost,
    },
    {
      id: "immediate",
      label: "Into buy orders",
      revenue: immediateRevenue,
      // No listing, so no broker fee — the tax is charged either way.
      net: immediateRevenue - salesTax - buildCost,
    },
  ];

  const chosen = routes[0];

  return {
    net: chosen.net,
    perUnit: quantityProduced > 0 ? chosen.net / quantityProduced : 0,
    margin: fraction(chosen.net, chosen.revenue),
    returnOnOutlay: fraction(chosen.net, buildCost),
    routes,
    breakEvenPerUnit:
      quantityProduced > 0
        ? (buildCost + brokerFee + salesTax) / quantityProduced
        : null,
  };
}

/**
 * One figure against another, or nothing where the second is nothing.
 *
 * A return measured against no outlay is not infinite, it is unanswerable — and
 * an infinity would colour every comparison beside it.
 *
 * @param {number} value
 * @param {number} of
 * @returns {number|null}
 */
function fraction(value, of) {
  if (!of) return null;
  return value / of;
}
