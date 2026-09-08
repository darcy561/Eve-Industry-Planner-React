import { splitOwnerHandle } from "../../Helper/ownerHandle.js";
import { activePlannerOwnerHandle } from "../../../Zustand/activePlanner/read.js";

const STATISTICS_ROOT = "/api/v1/statistics";

/**
 * Whose statistics a request is for, as the API names an owner: `kind:id`.
 *
 * @returns {string} an owner handle, escaped for a path, or "" when nobody is
 *   signed in
 */
export function currentOwnerHandle() {
  const handle = activePlannerOwnerHandle();
  if (!handle) return "";
  // The colon separates the halves, so only the id is escaped.
  const { kind, id } = splitOwnerHandle(handle);
  if (!kind || !id) return "";
  return `${kind}:${encodeURIComponent(id)}`;
}

/**
 * @param {"timeline"|"timeline/items"|"totals"} view
 * @returns {string|null} null when there is no owner to ask about
 */
export function statisticsPath(view) {
  const owner = currentOwnerHandle();
  if (!owner) return null;
  return `${STATISTICS_ROOT}/${owner}/${view}`;
}
