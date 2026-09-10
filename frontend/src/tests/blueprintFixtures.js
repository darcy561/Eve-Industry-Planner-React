/**
 * Raw ESI blueprint rows and a matching search index slice, shared by the blueprint collection
 * tests so that later stages assemble their views from the same rows.
 */

import { jobTypes } from "../Context/defaultValues";

export const RIFTER_BLUEPRINT_TYPE_ID = 686;
export const RIFTER_TYPE_ID = 587;
export const CAPACITOR_BLUEPRINT_TYPE_ID = 1195;
export const CAPACITOR_TYPE_ID = 11530;
export const POLYMER_REACTION_TYPE_ID = 46167;
export const POLYMER_TYPE_ID = 46066;
export const UNINDEXED_BLUEPRINT_TYPE_ID = 999999;

export const CHARACTER_HASH = "character-hash-a";
export const CORPORATION_ID = 98000001;

/** The slice of the cached search index these blueprints join against. */
export const blueprintSearchIndex = [
  {
    blueprintID: RIFTER_BLUEPRINT_TYPE_ID,
    itemID: RIFTER_TYPE_ID,
    jobType: jobTypes.manufacturing,
  },
  {
    blueprintID: CAPACITOR_BLUEPRINT_TYPE_ID,
    itemID: CAPACITOR_TYPE_ID,
    jobType: jobTypes.manufacturing,
  },
  {
    blueprintID: POLYMER_REACTION_TYPE_ID,
    itemID: POLYMER_TYPE_ID,
    jobType: jobTypes.reaction,
  },
];

/**
 * A character's blueprints: an original, a well-researched original of the same type, a copy, a
 * reaction formula, a market stack of untouched originals, and one whose product the search index
 * does not carry.
 */
export const characterBlueprintRows = [
  {
    item_id: 7001,
    type_id: RIFTER_BLUEPRINT_TYPE_ID,
    material_efficiency: 5,
    time_efficiency: 10,
    runs: -1,
    quantity: -1,
    location_id: 60003760,
    location_flag: "Hangar",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
  {
    item_id: 7002,
    type_id: RIFTER_BLUEPRINT_TYPE_ID,
    material_efficiency: 10,
    time_efficiency: 20,
    runs: -1,
    quantity: -1,
    location_id: 60003760,
    location_flag: "Hangar",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
  {
    item_id: 7003,
    type_id: RIFTER_BLUEPRINT_TYPE_ID,
    material_efficiency: 10,
    time_efficiency: 20,
    runs: 300,
    quantity: -2,
    location_id: 7900,
    location_flag: "Unlocked",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
  {
    item_id: 7004,
    type_id: POLYMER_REACTION_TYPE_ID,
    material_efficiency: 0,
    time_efficiency: 0,
    runs: -1,
    quantity: -1,
    location_id: 60003760,
    location_flag: "Hangar",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
  // A manufacturing stack reaches this state only untouched from the market: one row, five
  // usable originals.
  {
    item_id: 7005,
    type_id: CAPACITOR_BLUEPRINT_TYPE_ID,
    material_efficiency: 0,
    time_efficiency: 0,
    runs: -1,
    quantity: 5,
    location_id: 60003760,
    location_flag: "Hangar",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
  {
    item_id: 7006,
    type_id: UNINDEXED_BLUEPRINT_TYPE_ID,
    material_efficiency: 0,
    time_efficiency: 0,
    runs: -1,
    quantity: -1,
    location_id: 60003760,
    location_flag: "Hangar",
    CharacterHash: CHARACTER_HASH,
    character_id: 2114000001,
    is_corporation: false,
  },
];

/**
 * Three interchangeable copies of the same blueprint: same owner, same research, same runs left.
 *
 * What the library consolidates onto one card — and what a job running on one of them breaks up,
 * since that one is unavailable until the job finishes.
 */
export const identicalCopyRows = [7020, 7021, 7022].map((itemId) => ({
  item_id: itemId,
  type_id: RIFTER_BLUEPRINT_TYPE_ID,
  material_efficiency: 10,
  time_efficiency: 20,
  runs: 10,
  quantity: -2,
  location_id: 60003760,
  location_flag: "Hangar",
  CharacterHash: CHARACTER_HASH,
  character_id: 2114000001,
  is_corporation: false,
}));

/**
 * A stack of reaction formulas. Formulas carry no research values and cannot be copied, and they
 * restack after every use — so unlike a manufacturing original, a stacked quantity is their normal
 * condition rather than a sign they are untouched.
 */
export const reactionFormulaStackRow = {
  item_id: 7010,
  type_id: POLYMER_REACTION_TYPE_ID,
  material_efficiency: 0,
  time_efficiency: 0,
  runs: -1,
  quantity: 4,
  location_id: 60003760,
  location_flag: "Hangar",
  CharacterHash: CHARACTER_HASH,
  character_id: 2114000001,
  is_corporation: false,
};

/** A corporation's blueprints, which carry no CharacterHash. */
export const corporationBlueprintRows = [
  {
    item_id: 8001,
    type_id: RIFTER_BLUEPRINT_TYPE_ID,
    material_efficiency: 8,
    time_efficiency: 16,
    runs: -1,
    quantity: -1,
    location_id: 60003760,
    location_flag: "CorpSAG1",
    corporation_id: CORPORATION_ID,
    is_corporation: true,
  },
  {
    item_id: 8002,
    type_id: POLYMER_REACTION_TYPE_ID,
    material_efficiency: 0,
    time_efficiency: 0,
    runs: 50,
    quantity: -2,
    location_id: 60003760,
    location_flag: "CorpSAG2",
    corporation_id: CORPORATION_ID,
    is_corporation: true,
  },
];
