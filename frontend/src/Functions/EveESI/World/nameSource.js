import {
  LOCATION_KIND,
  resolveLocationKind,
} from "../../Assets/assetLocationConstants";

/**
 * Where a name for an EVE id can be got, if anywhere.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const NAME_SOURCE = Object.freeze({
  BULK: "bulk",
  CHARACTER: "character",
  NONE: "none",
});

/**
 * The place kinds `POST /universe/names` answers for.
 *
 * @type {Set<string>}
 */
const BULK_NAMEABLE_PLACES = new Set([
  LOCATION_KIND.REGION,
  LOCATION_KIND.CONSTELLATION,
  LOCATION_KIND.SYSTEM,
  LOCATION_KIND.ABYSSAL_SYSTEM,
  LOCATION_KIND.STATION,
]);

/**
 * The id ranges holding the things `POST /universe/names` answers for that are not places:
 * factions, NPC corporations and characters, and the player characters, corporations and alliances
 * issued across EVE's several id eras.
 *
 * @see https://developers.eveonline.com/docs/guides/id-ranges/
 * @type {Array<[number, number]>}
 */
const BULK_NAMEABLE_ENTITY_RANGES = [
  [500000, 599999], // factions
  [1000000, 1999999], // NPC corporations
  [3000000, 3999999], // NPC characters — agents and NPC corporation CEOs
  [90000000, 97999999], // characters, 2010–2016
  [98000000, 98999999], // corporations
  [99000000, 99999999], // alliances
  [100000000, 2099999999], // characters, corporations and alliances before 2010
  [2100000000, 2129999999], // characters, since 2016
];

/**
 * Where to ask for an id's name.
 *
 * `POST /universe/names` answers for alliances, characters, constellations, corporations, types,
 * regions, solar systems, stations and factions, and refuses the whole call over anything else. A
 * player structure is not among them and is read from a character's token instead.
 *
 * `NONE` is an answer, not a gap: a moon, a stargate, a station's office folder and an id in no
 * documented range can each arrive from somewhere, and none of them can be named by either path.
 * Asking anyway spends an error either way — a refused batch for the bulk lookup, a 403 per
 * character for the structure walk.
 *
 * @param {number} id
 * @returns {string} one of {@link NAME_SOURCE}
 */
export default function nameSource(id) {
  const kind = resolveLocationKind(id);
  if (BULK_NAMEABLE_PLACES.has(kind)) return NAME_SOURCE.BULK;
  if (kind === LOCATION_KIND.STRUCTURE) return NAME_SOURCE.CHARACTER;
  if (
    BULK_NAMEABLE_ENTITY_RANGES.some(([low, high]) => id >= low && id <= high)
  ) {
    return NAME_SOURCE.BULK;
  }
  return NAME_SOURCE.NONE;
}
