/**
 * Active Planner Slice for EVE Industry Planner.
 *
 * Which planner the app works in; `plannerSettings` holds what each one is
 * configured as.
 */

import { stateDefault, activePlannerActions } from "./activePlanner";

/**
 * @param {Function} set - Zustand set function for updating state
 * @param {Function} get - Zustand get function for accessing current state
 * @returns {Object} Active planner slice with state and actions
 */
const activePlannerSlice = (set, get) => ({
  activePlanner: {
    ...stateDefault(),

    actions: {
      ...activePlannerActions(set, get),
    },
  },
});

export default activePlannerSlice;
