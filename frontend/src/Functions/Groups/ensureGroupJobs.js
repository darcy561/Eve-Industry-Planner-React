import useUsersStore from "../../Zustand/usersStore";

/**
 * Loads every job a group holds, so a page opened against that group has them.
 *
 * A login fetches the jobs that sit on the planner; a group's members are fetched when
 * the group is opened, and opening one is either the group page or a job opened inside
 * it. Archived members are left alone — they have no job document until restored.
 *
 * @param {string} groupID
 * @returns {Promise<Object|null>} The group, or null when the planner has no such group.
 */
export async function ensureGroupJobs(groupID) {
  const { jobData } = useUsersStore.getState();
  const group = jobData.actions.getGroupObject(groupID);
  if (!group) return null;

  await jobData.actions.jobsFromIdsOrObjects(group.liveMemberIDs);
  return group;
}
