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
 * The choice is `applicationSettings.defaultMarketCharacter`. Until one is made,
 * or where the chosen character has since left the account, this stands in with
 * the account's main and says so, so a rate block can state that it is guessing.
 */

/**
 * @typedef {object} SellerCharacter
 * @property {string|null} hash - CharacterHash, or null when signed out
 * @property {string|null} name
 * @property {boolean} isDefault - Whether this is a stand-in rather than a choice
 */

/**
 * @param {string|null} [override] - A seller named by the job, once one can be
 * @returns {SellerCharacter}
 */
export function resolveSellerCharacter(override) {
  const { account, applicationSettings } = useUsersStore.getState();
  const { actions } = account;

  const chosenHash = override ?? applicationSettings.defaultMarketCharacter;
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
