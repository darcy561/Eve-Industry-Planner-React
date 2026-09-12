import useUsersStore from "../../Zustand/usersStore";

/**
 * Which group the reader is working in, read from the URL.
 *
 * The group page names it in its path; a job opened inside a group carries it in
 * `activeGroup`. Anywhere else there is no group, and saying so is the point: a job
 * added from the planner is filed by this value, so a group left behind by an earlier
 * page would quietly collect it.
 *
 * @param {{routeId?: string, params?: Object, search?: Object}} match
 * @returns {string|null}
 */
export function activeGroupForRoute({ routeId, params, search } = {}) {
  if (routeId === "/group/$groupID") return params?.groupID ?? null;
  if (routeId === "/editjob/$jobID") return search?.activeGroup ?? null;
  return null;
}

/** Puts the store in step with the route being entered. */
export function applyActiveGroupForRoute(match) {
  const groupID = activeGroupForRoute(match);
  const { jobData } = useUsersStore.getState();
  if (jobData.activeGroupID === groupID) return;

  if (groupID) {
    jobData.actions.setActiveGroupID(groupID);
  } else {
    jobData.actions.clearActiveGroupID();
  }
}
