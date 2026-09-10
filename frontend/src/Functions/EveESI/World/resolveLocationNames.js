import getWorldData from "./getWorldData";
import useUsersStore from "../../../Zustand/usersStore";
import { isNoAccessLocation } from "../../Assets/assetLocationConstants";

/**
 * Names for locations the store does not already hold, resolved against the account's characters.
 *
 * Access to a structure's name is per character: one pilot holds docking rights where another does
 * not, and ESI answers accordingly. So the characters are tried in turn, and a structure only
 * settles as unreachable once every one of them has failed to name it.
 *
 * A refusal comes back as a named placeholder rather than an absence, which is what made the
 * existing walk stop early — the placeholder looked like an answer, so the characters after the
 * first never got asked. Here a placeholder is held but not treated as settled.
 *
 * The store is written once, at the end, rather than per character: `getWorldData` skips anything
 * the store already holds, so writing a placeholder mid-walk would hide the id from the very
 * characters still to be tried.
 *
 * @param {Array<number>|Set<number>} locationIds
 * @param {Array<Object>} characters - the account's characters, tried in order
 * @returns {Promise<Object<string, Object>>} what was resolved, keyed by location id
 */
export default async function resolveLocationNames(locationIds, characters = []) {
  const requested = [...(locationIds ?? [])];
  if (requested.length === 0) return {};

  const resolved = {};

  for (const character of characters) {
    const outstanding = requested.filter((id) => !isNamed(resolved[id]));
    if (outstanding.length === 0) break;

    const found = await getWorldData(outstanding, character);

    for (const [id, value] of Object.entries(found)) {
      if (isNamed(value) || !resolved[id]) {
        resolved[id] = value;
      }
    }
  }

  if (Object.keys(resolved).length > 0) {
    useUsersStore.getState().worldData.actions.addUniverseIDs(resolved);
  }

  return resolved;
}

/**
 * Whether a resolution actually named the location, as against standing in for one.
 *
 * @param {Object|undefined} value
 * @returns {boolean}
 */
function isNamed(value) {
  return Boolean(value) && !isNoAccessLocation(value);
}
