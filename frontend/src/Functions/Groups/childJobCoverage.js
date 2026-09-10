/**
 * How much of a material's requirement its child jobs actually produce, and what
 * that makes the material cost.
 *
 * A child job is sized to the parent's requirement when it is created and never
 * again until the parent is closed, so the two drift apart the moment the parent
 * changes runs, efficiency or setup. Costing the requirement at the child's
 * per-unit rate quietly assumes the child will be resized to match — which is
 * true when it is going to be, and a fabrication when it is not.
 */

/**
 * How the part of a requirement the children do not produce is costed.
 *
 * @enum {string}
 */
export const COVERAGE_MODE = {
  /** The child is resized to the requirement before it is committed. */
  RESIZE: "resize",
  /** The child may be resized on close, so cost the shortfall at its own rate. */
  EXTRAPOLATE: "extrapolate",
  /** The child is not going to be resized, so buy the shortfall. */
  SPLIT: "split",
};

/**
 * @typedef {object} ChildJobContributor
 * @property {string} jobID
 * @property {number} produced - What this job actually makes
 * @property {number} unitCost - What each unit it makes costs
 */

/**
 * @typedef {object} ChildJobCoverage
 * @property {number} required
 * @property {number} produced - Across every contributing job
 * @property {number} covered - Of the requirement, what the jobs actually make
 * @property {number} shortfall - What they do not
 * @property {number} surplus - What they make beyond the requirement
 * @property {boolean} isShort
 * @property {string} mode - One of COVERAGE_MODE
 * @property {number} buildCost - The covered part, at what the jobs cost
 * @property {number} buyCost - The shortfall, at market; zero when extrapolating
 * @property {number} total
 * @property {number|null} unitCost - The whole requirement's cost per unit
 * @property {boolean} assumed - Whether any of the total is a resize that has
 *   not happened
 */

/**
 * @param {object} params
 * @param {number} params.required - What the parent needs
 * @param {ChildJobContributor[]} [params.contributors]
 * @param {number|null} [params.buyPrice] - Unit price for the shortfall
 * @param {string} [params.mode] - One of COVERAGE_MODE
 * @returns {ChildJobCoverage}
 */
export function childJobCoverage({
  required = 0,
  contributors = [],
  buyPrice = null,
  mode = COVERAGE_MODE.EXTRAPOLATE,
}) {
  // Allocated once across every contributor rather than per contributor, or two
  // jobs each producing half the requirement would both be costed for all of it.
  const ordered = [...contributors].sort((a, b) =>
    String(a.jobID).localeCompare(String(b.jobID)),
  );

  let remaining = required;
  let covered = 0;
  let buildCost = 0;
  let produced = 0;

  for (const contributor of ordered) {
    const makes = Math.max(0, contributor.produced ?? 0);
    produced += makes;

    const takes = Math.min(makes, remaining);
    remaining -= takes;
    covered += takes;
    buildCost += takes * (contributor.unitCost ?? 0);
  }

  const shortfall = remaining;
  const blended = covered > 0 ? buildCost / covered : fallbackRate(ordered);

  // Nothing to buy the shortfall at is not a reason to state no cost for it: the
  // rate the jobs themselves run at is the only figure left, so it extrapolates
  // and says it did.
  const canBuy = mode === COVERAGE_MODE.SPLIT && Number.isFinite(buyPrice);
  const buyCost = canBuy ? shortfall * buyPrice : 0;
  const assumedCost = canBuy ? 0 : shortfall * (blended ?? 0);

  const total = buildCost + buyCost + assumedCost;

  // An uncommitted job is resized to the requirement as part of committing it,
  // so costing the whole requirement at its rate states what committing would
  // produce. Nothing is being assumed about a job that is going to change.
  const willResize = mode === COVERAGE_MODE.RESIZE;

  // What was actually done, which is not always what was asked for: a split with
  // no price to split against falls back to the jobs' own rate.
  const resolvedMode = canBuy
    ? COVERAGE_MODE.SPLIT
    : willResize
      ? COVERAGE_MODE.RESIZE
      : COVERAGE_MODE.EXTRAPOLATE;

  return {
    required,
    produced,
    covered,
    shortfall,
    surplus: Math.max(0, produced - required),
    isShort: shortfall > 0 && !willResize,
    mode: resolvedMode,
    buildCost,
    buyCost,
    total,
    // A requirement of nothing has no per-unit cost rather than an infinite one.
    unitCost: required > 0 ? total / required : null,
    assumed: assumedCost > 0 && !willResize,
  };
}

/**
 * The rate to extrapolate at when the jobs cover none of the requirement.
 *
 * @param {ChildJobContributor[]} contributors
 * @returns {number|null}
 */
function fallbackRate(contributors) {
  const rated = contributors
    .map((i) => i.unitCost)
    .filter((rate) => Number.isFinite(rate) && rate > 0);

  return rated.length > 0 ? Math.min(...rated) : null;
}

/**
 * Which way a row's shortfall should be costed.
 *
 * An uncommitted job is resized when it is committed, so costing it against the
 * whole requirement states what committing it would produce rather than a claim
 * about the job as it stands. A committed one is only resized on close, and only
 * when the account asks for that — without it the shortfall is real and has to
 * be bought.
 *
 * @param {object} params
 * @param {boolean} params.isCommitted - Whether the child jobs are real yet
 * @param {boolean} params.automaticRecalculation
 * @returns {string} One of COVERAGE_MODE
 */
export function coverageModeFor({ isCommitted, automaticRecalculation }) {
  if (!isCommitted) return COVERAGE_MODE.RESIZE;
  return automaticRecalculation
    ? COVERAGE_MODE.EXTRAPOLATE
    : COVERAGE_MODE.SPLIT;
}

/**
 * How the units the child jobs do not make were costed, in words.
 *
 * Said in two places — the tag on the material row and the warning inside the
 * drawer — so it is written once. The two disagreeing about what the shortfall
 * costs would be worse than either saying nothing.
 *
 * @param {ChildJobCoverage} coverage
 * @param {(value: number) => string} formatQuantity
 * @param {(value: number) => string} [formatIsk] - Given where the total is
 *   worth naming, as it is in the drawer
 * @returns {string}
 */
export function shortfallWording(coverage, formatQuantity, formatIsk) {
  const missing = formatQuantity(coverage.shortfall);

  if (coverage.mode !== COVERAGE_MODE.SPLIT) {
    return `The ${missing} missing are costed at the child job's own rate, on the assumption it is resized to cover them.`;
  }

  const at = formatIsk ? `, ${formatIsk(coverage.buyCost)} in total` : "";
  return `The ${missing} missing are costed at the market price${at}.`;
}
