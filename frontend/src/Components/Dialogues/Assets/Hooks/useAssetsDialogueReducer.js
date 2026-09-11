import { useReducer } from "react";
import {
  ASSETS_DIALOGUE_ACTION_TYPES,
  assetsDialogueReducer,
} from "./assetsDialogueReducer";
import useUsersStore from "../../../../Zustand/usersStore";
import {
  ASSET_OWNER,
  EVERY_CHARACTER,
  scopeValue,
} from "../../../Assets/assetScopePicker";

/**
 * The assets dialogue's state: what is being looked for, and whose holdings are being searched.
 *
 * @returns {{state: {isOpen: boolean, selectedTypeID: number|null, scope: string}, actions: Object}}
 */
export default function useAssetsDialogueReducer() {
  const createInitialState = () => {
    const { characters, mainCharacterHash } = useUsersStore.getState().account;

    return {
      isOpen: false,
      selectedTypeID: null,
      // An account flying several characters is asking where a material is, not which of them has
      // it, so it opens across all of them.
      scope:
        characters.length > 1
          ? EVERY_CHARACTER
          : scopeValue({
              kind: ASSET_OWNER.CHARACTER,
              id: mainCharacterHash ?? characters[0]?.CharacterHash,
            }),
    };
  };

  const [state, dispatch] = useReducer(
    (current, action) =>
      assetsDialogueReducer(current, action, createInitialState),
    undefined,
    createInitialState,
  );

  const actions = {
    resetState: () => {
      dispatch({ type: ASSETS_DIALOGUE_ACTION_TYPES.RESET_STATE });
    },
    toggleIsOpen: () => {
      dispatch({ type: ASSETS_DIALOGUE_ACTION_TYPES.TOGGLE_IS_OPEN });
    },
    /** @param {number|null} typeID */
    setSelectedTypeID: (typeID) => {
      dispatch({
        type: ASSETS_DIALOGUE_ACTION_TYPES.SET_SELECTED_TYPE_ID,
        payload: typeID,
      });
    },
    /** @param {string} scope - an {@link scopeValue} */
    setScope: (scope) => {
      dispatch({
        type: ASSETS_DIALOGUE_ACTION_TYPES.SET_SCOPE,
        payload: scope,
      });
    },
  };

  return { state, actions };
}
