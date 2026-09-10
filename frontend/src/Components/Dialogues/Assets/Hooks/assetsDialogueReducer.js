/**
 * Action types for the assets dialogue reducer.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ASSETS_DIALOGUE_ACTION_TYPES = Object.freeze({
  RESET_STATE: "RESET_STATE",
  TOGGLE_IS_OPEN: "TOGGLE_IS_OPEN",
  SET_SELECTED_TYPE_ID: "SET_SELECTED_TYPE_ID",
  SET_SCOPE: "SET_SCOPE",
});

/**
 * @param {{isOpen: boolean, selectedTypeID: number|null, scope: string}} state
 * @param {{type: string, payload?: *}} action
 * @param {() => Object} createInitialState
 * @returns {Object}
 */
export function assetsDialogueReducer(state, action, createInitialState) {
  switch (action.type) {
    case ASSETS_DIALOGUE_ACTION_TYPES.RESET_STATE:
      return createInitialState();
    case ASSETS_DIALOGUE_ACTION_TYPES.TOGGLE_IS_OPEN:
      return { ...state, isOpen: !state.isOpen };
    case ASSETS_DIALOGUE_ACTION_TYPES.SET_SELECTED_TYPE_ID:
      return { ...state, selectedTypeID: action.payload };
    case ASSETS_DIALOGUE_ACTION_TYPES.SET_SCOPE:
      return { ...state, scope: action.payload };
    default:
      return state;
  }
}
