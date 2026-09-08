import useUsersStore from "../usersStore";

/**
 * The planner a scoped read or write is for, outside a React render.
 *
 * @returns {string|null} an owner handle, or null when nobody is signed in
 */
export function activePlannerOwnerHandle() {
  return useUsersStore.getState().activePlanner.actions.getActivePlannerOwner();
}
