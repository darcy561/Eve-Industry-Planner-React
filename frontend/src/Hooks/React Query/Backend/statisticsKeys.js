import {
  plannerQueryScope,
  STATISTICS_QUERY_KEY_ROOT,
} from "./plannerQueryScope.js";

export { STATISTICS_QUERY_KEY_ROOT };

/**
 * The prefix every statistics key carries: the root, then whose figures they are.
 *
 * @returns {import("@tanstack/react-query").QueryKey}
 */
export function statisticsQueryScope() {
  return plannerQueryScope(STATISTICS_QUERY_KEY_ROOT);
}
