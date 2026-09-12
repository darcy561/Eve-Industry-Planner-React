/**
 * The names resolved for universe ids. `useLocationNames` reads what is here before it asks ESI,
 * and writes back what it resolves.
 *
 * @param {Function} set - Zustand set function for updating state
 * @returns {Object} Universe data management actions
 */
export const universeDataActions = (set) => ({
  /**
   * Merges resolved names into the map, keyed by id.
   *
   * @param {Object<string, {name: string}>} inputObject
   */
  addUniverseIDs: (inputObject = {}) => {
    set(
      (state) => ({
        ...state,
        worldData: {
          ...state.worldData,
          universeIDs: {
            ...state.worldData.universeIDs,
            ...inputObject,
          },
        },
      }),
      false,
      "addUniverseIDs",
    );
  },
});
