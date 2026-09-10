import useUsersStore from "../../Zustand/usersStore";
import { OWNER_KIND } from "./ownerKind";

/**
 * What the account calls an owner.
 *
 * @param {import("./ownerKind").EveOwner|null} [owner]
 * @returns {string} empty when there is no owner to name
 */
export function ownerName(owner) {
  if (!owner?.id) return "";

  const { actions } = useUsersStore.getState().account;

  return owner.kind === OWNER_KIND.CORPORATION
    ? actions.getCorporation(owner.id)?.corporationName ?? "Unknown corporation"
    : actions.findCharacterByHash(owner.id)?.CharacterName ?? "Unknown character";
}

/**
 * The only sizes EVE's image server serves. Anything else is answered with a 400 and no image.
 *
 * @type {number[]}
 */
const IMAGE_SIZES = [32, 64, 128, 256, 512, 1024];

/**
 * The size to ask the image server for, given how many pixels it will be drawn at.
 *
 * Rounds up, so an avatar is never scaled up from a smaller image.
 *
 * @param {number} pixels
 * @returns {number}
 */
export function eveImageSize(pixels) {
  return IMAGE_SIZES.find((size) => size >= pixels) ?? IMAGE_SIZES.at(-1);
}

/**
 * EVE's own portrait or logo for an owner.
 *
 * A corporation is addressed by the id the image server wants; a character is held by hash, which
 * has to be resolved to its id first.
 *
 * @param {import("./ownerKind").EveOwner|null} [owner]
 * @param {number} [pixels] - how large it will be drawn
 * @returns {string|undefined} undefined when there is no image to show
 */
export function ownerImageUrl(owner, pixels = 32) {
  if (!owner?.id) return undefined;

  const size = eveImageSize(pixels);

  if (owner.kind === OWNER_KIND.CORPORATION) {
    return `https://images.evetech.net/corporations/${owner.id}/logo?size=${size}`;
  }

  const character = useUsersStore
    .getState()
    .account.actions.findCharacterByHash(owner.id);

  return character?.CharacterID
    ? `https://images.evetech.net/characters/${character.CharacterID}/portrait?size=${size}`
    : undefined;
}
