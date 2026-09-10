import useUsersStore from "../../Zustand/usersStore";

/**
 * Who lists the order.
 *
 * The character that builds a job and the character that sells its output are
 * routinely not the same: a trading alt carries Broker Relations, Accounting and
 * the standings grind, while manufacturing sits elsewhere. Reading the fee from
 * the build setup does not merely pick a different character — it usually picks
 * one with no market skills at all, and quotes the untrained rate as if it were
 * the player's.
 *
 * Nothing stores the choice yet, so this resolves to the account's main and every
 * consumer reaches it through here. Storing a chosen seller is then a change to
 * this file alone — the same shape the saved sale locations use.
 */

/**
 * @typedef {object} SellerCharacter
 * @property {string|null} hash - CharacterHash, or null when signed out
 * @property {string|null} name
 * @property {boolean} isDefault - Whether this is a stand-in rather than a choice
 */

/**
 * @param {string|null} [chosenHash] - A stored seller, once one can be chosen
 * @returns {SellerCharacter}
 */
export function resolveSellerCharacter(chosenHash) {
  const { actions } = useUsersStore.getState().account;

  const chosen = chosenHash ? actions.findCharacterByHash(chosenHash) : null;
  if (chosen) {
    return {
      hash: chosen.CharacterHash,
      name: chosen.CharacterName,
      isDefault: false,
    };
  }

  const main = actions.getMainCharacter();
  return {
    hash: main?.CharacterHash ?? null,
    name: main?.CharacterName ?? null,
    isDefault: true,
  };
}
