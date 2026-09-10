/**
 * The kinds of EVE entity the account holds things as.
 *
 * An asset node's `owner.kind` and a blueprint row's `ownerType` are the same fact and take these
 * values, so a consumer comparing one against the other is comparing like with like.
 *
 * It sits on its own, away from the helpers that resolve an owner's name and portrait, because
 * those read the user store and the collection builders that need these values are pure.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const OWNER_KIND = Object.freeze({
  CHARACTER: "character",
  CORPORATION: "corporation",
});

/**
 * @typedef {Object} EveOwner
 * @property {string} kind - see {@link OWNER_KIND}
 * @property {string|number} id - CharacterHash, or corporation id
 */
