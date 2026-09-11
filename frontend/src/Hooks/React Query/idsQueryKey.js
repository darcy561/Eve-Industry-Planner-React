/**
 * The part of a query key that stands for a set of ids.
 *
 * Two callers asking for the same ids share one cache entry however they came by
 * them — in any order, with repeats, as numbers or as strings — which is the whole
 * point of keying a query on a set rather than on a caller.
 *
 * @param {Iterable<string|number|null|undefined>} ids
 * @returns {string}
 */
export function idsQueryKeySuffix(ids) {
  return [...new Set([...(ids ?? [])].filter(Boolean).map(String))]
    .sort()
    .join(",");
}
