/**
 * Planner Settings Slice for EVE Industry Planner.
 *
 * Separate from `applicationSettings`, which stays the account's own.
 */

import { stateDefault, plannerSettingsActions } from "./plannerSettings";

/**
 * @param {Function} set - Zustand set function for updating state
 * @param {Function} get - Zustand get function for accessing current state
 * @returns {Object} Planner settings slice with state and actions
 */
const plannerSettingsSlice = (set, get) => ({
  plannerSettings: {
    ...stateDefault(),

    actions: {
      ...plannerSettingsActions(set, get),
    },
  },
});

export default plannerSettingsSlice;
