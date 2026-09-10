import useUsersStore from "../../Zustand/usersStore";

/**
 * The characters whose tokens may be used to read a corporation's data, in the order they are
 * tried.
 *
 * @param {number|string} corporationId
 * @returns {string[]} CharacterHashes
 */
export function corporationMembers(corporationId) {
  const { corporations } = useUsersStore.getState().account;
  const corporation = corporations?.find(
    (c) => Number(c.corporation_id) === Number(corporationId)
  );
  return corporation?.members ?? [];
}

/**
 * Reads a corporation endpoint through the first member the endpoint does not refuse.
 *
 * ESI gates corporation data on in-game roles, which the app cannot see. Fetching through every
 * member to be sure of coverage spends the rate budget N times over for data one call returns, so
 * members are tried in order and the walk stops at the first success — normally the first member.
 *
 * `attempt` must report a refusal rather than folding it into empty rows: a 403 and a corporation
 * that genuinely holds nothing are otherwise the same answer, and the walk cannot tell whether to
 * continue.
 *
 * @template T
 * @param {string[]} memberHashes
 * @param {(character: Object, characterHash: string) => Promise<{rows: T[], forbidden: boolean}>} attempt
 * @returns {Promise<T[]>} the first unrefused member's rows; empty when every member is refused
 */
export async function readAsAuthorisedMember(memberHashes, attempt) {
  const { findCharacterByHash } = useUsersStore.getState().account.actions;

  for (const memberHash of memberHashes) {
    const character = findCharacterByHash(memberHash);
    if (!character) continue;

    const { rows, forbidden } = await attempt(character, memberHash);
    if (forbidden) continue;

    return rows;
  }

  return [];
}
