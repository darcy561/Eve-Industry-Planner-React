/**
 * An owner handle is `kind:id` — how the API names whose documents are meant.
 *
 * Only the first colon separates the two: an account id may contain one.
 */

import useUsersStore from "../../Zustand/usersStore";

/**
 * The planner a scoped read or write is for.
 *
 * @returns {string|null} an owner handle, or null when nobody is signed in
 */
export function activePlannerOwnerHandle() {
  return (
    useUsersStore.getState()?.activePlanner?.actions?.getActivePlannerOwner?.() ??
    null
  );
}

/**
 * @param {string} handle
 * @returns {{kind: string, id: string}}
 */
export function splitOwnerHandle(handle) {
  const separator = (handle ?? "").indexOf(":");
  if (separator < 0) return { kind: "", id: "" };
  return {
    kind: handle.slice(0, separator),
    id: handle.slice(separator + 1),
  };
}

/**
 * The EVE id a corporation or alliance handle names.
 *
 * @param {string} handle
 * @returns {number|null} null when the handle names no entity id
 */
export function entityIDFromOwnerHandle(handle) {
  const { id } = splitOwnerHandle(handle);
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}
