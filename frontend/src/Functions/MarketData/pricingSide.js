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
