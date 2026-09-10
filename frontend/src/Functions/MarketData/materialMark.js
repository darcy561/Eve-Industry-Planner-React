import { jobTypeNames, jobTypes } from "../../Context/defaultValues";

/**
 * The mark at the head of a material row: what kind of thing it is, and whether
 * anything is building it yet.
 *
 * Raw Resources carried this as a coloured dot that became a tick, with the job
 * type in its tooltip. It is three separate facts in one glyph, so it is worked
 * out here rather than in the row that draws it.
 */

/**
 * @enum {string}
 */
export const MATERIAL_MARK = {
  /** Nothing is building it. */
  PLAIN: "plain",
  /** A child job is linked. */
  LINKED: "linked",
  /** A child job is intended but not linked yet. */
  PENDING: "pending",
};

/**
 * @typedef {object} MaterialMark
 * @property {string} kind - One of MATERIAL_MARK
 * @property {string} label - What a reader is told on hover
 * @property {number} jobType - For the accent colour the row resolves
 * @property {boolean} isUnsettled - Pending against a type that could be linked,
 *   which the old row marked amber rather than by job type
 * @property {boolean} isExempt - Excluded from builds by the account's settings
 */

/**
 * @param {object} params
 * @param {number} params.jobType
 * @param {boolean} params.hasLinked
 * @param {boolean} params.hasPending - A temporary or pending-add child job
 * @param {boolean} [params.isExempt]
 * @returns {MaterialMark}
 */
export function materialMark({ jobType, hasLinked, hasPending, isExempt = false }) {
  const name = jobTypeNames[jobType] ?? "Material";

  const kind = hasLinked
    ? MATERIAL_MARK.LINKED
    : hasPending
      ? MATERIAL_MARK.PENDING
      : MATERIAL_MARK.PLAIN;

  // Only a type that can actually be built has an unsettled state: a base
  // material with something pending against it is not waiting on anything.
  const buildable =
    jobType === jobTypes.manufacturing || jobType === jobTypes.reaction;

  return {
    kind,
    jobType,
    isUnsettled: buildable && !hasLinked && hasPending,
    isExempt,
    label: markLabel(name, kind, isExempt),
  };
}

/**
 * @param {string} name
 * @param {string} kind
 * @param {boolean} isExempt
 * @returns {string}
 */
function markLabel(name, kind, isExempt) {
  const base =
    kind === MATERIAL_MARK.LINKED
      ? `${name} Linked`
      : kind === MATERIAL_MARK.PENDING
        ? `${name} Pending`
        : name;

  return isExempt ? `${base} — exempt from builds` : base;
}
