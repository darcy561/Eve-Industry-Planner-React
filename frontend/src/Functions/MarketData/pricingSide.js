import GLOBAL_CONFIG from "../../global-config-app";

const { DEFAULT_MARKET_OPTION, DEFAULT_ORDER_OPTION } = GLOBAL_CONFIG;

/**
 * Which side of a job is being priced. Not which side of the order book — that
 * is the basis, and the two disagree: materials being bought are normally priced
 * from the sell side, because the ask is what buying costs.
 */
export const PRICING_SIDE = {
  BUYING: "buying",
  SELLING: "selling",
};

/**
 * The sides a control offers, named for what is being priced rather than for the
 * side itself: a basis is also called buy or sell, so "buying market" beside a
 * basis of "Sell Orders" reads as a contradiction when it is the normal case.
 */
export const PRICING_SIDES = [
  { side: PRICING_SIDE.BUYING, noun: "Materials" },
  { side: PRICING_SIDE.SELLING, noun: "Output" },
];

/**
 * Where one side of a job is priced: the job's own choice, then the account's
 * default, then the global one.
 *
 * Market and basis resolve independently, so a job naming a market without a
 * basis keeps the account's basis rather than losing it. An empty value is not a
 * choice at any rung — that rule is what lets a stored document leave a field out
 * rather than having to carry a placeholder.
 *
 * @param {object} params
 * @param {object|null|undefined} params.jobPricing - `layout.localPricing`
 * @param {object|null|undefined} params.accountPricing - `defaultPricing`
 * @param {string} params.side - One of PRICING_SIDE
 * @returns {{marketDisplay: string, orderDisplay: string}}
 */
export function resolvePricingSide({ jobPricing, accountPricing, side }) {
  const job = jobPricing?.[side];
  const account = accountPricing?.[side];

  return {
    marketDisplay: job?.market || account?.market || DEFAULT_MARKET_OPTION,
    orderDisplay: job?.basis || account?.basis || DEFAULT_ORDER_OPTION,
  };
}

/**
 * A job's pricing override with one field of one side set.
 *
 * Returns null once the last choice is cleared, so a job that has chosen nothing
 * carries no override at all rather than an empty pair on every document.
 *
 * @param {object|null|undefined} jobPricing - `layout.localPricing`
 * @param {string} side - One of PRICING_SIDE
 * @param {"market"|"basis"} key
 * @param {string|null|undefined} value
 * @returns {object|null}
 */
export function setJobPricingSide(jobPricing, side, key, value) {
  const next = {
    buying: { market: null, basis: null, ...jobPricing?.buying },
    selling: { market: null, basis: null, ...jobPricing?.selling },
  };
  next[side] = { ...next[side], [key]: value || null };

  const chosen = Object.values(next).some((one) => one.market || one.basis);

  return chosen ? next : null;
}

/**
 * How far a walk may climb before it stops looking.
 *
 * EVE's market tree is a handful of levels deep, so a walk longer than this has
 * met a cycle the published data should not contain. Stopping is better than
 * hanging on a row that renders once per material.
 */
const MAX_GROUP_DEPTH = 32;

/**
 * The nearest market group default above an item, for one side of a job.
 *
 * Market and basis are answered separately and each stops at the first group
 * that names it, so a group naming a market without a basis narrows one axis and
 * leaves the other to whatever answers next. A nearer group outranks a further
 * one, which is the same rule every other rung uses.
 *
 * @param {object} params
 * @param {number|undefined} params.marketGroupID - The item's own market group
 * @param {Object<string, {parent_id?: number}>} params.marketGroups - The tree
 * @param {Object<string, {market?: string, basis?: string}>} [params.groupDefaults]
 * @returns {{market: string|null, basis: string|null}}
 */
export function resolveGroupDefault({
  marketGroupID,
  marketGroups,
  groupDefaults,
}) {
  const answer = { market: null, basis: null };
  if (!marketGroupID || !groupDefaults) return answer;

  let id = marketGroupID;
  for (let step = 0; step < MAX_GROUP_DEPTH && id; step += 1) {
    const chosen = groupDefaults[String(id)];
    if (chosen) {
      answer.market ||= chosen.market || null;
      answer.basis ||= chosen.basis || null;
      if (answer.market && answer.basis) return answer;
    }
    id = marketGroups?.[String(id)]?.parent_id;
  }

  return answer;
}
