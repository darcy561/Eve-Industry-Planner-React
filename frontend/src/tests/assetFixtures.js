/**
 * Raw ESI asset rows shared by the asset collection tests.
 *
 * Stage-by-stage tests read the same rows so that a change in what a field *means* shows up as a
 * disagreement between consumers rather than passing unnoticed in one of them.
 */

export const JITA_STATION_ID = 60003760;
export const RAITARU_STRUCTURE_ID = 1035466617946;
/** ESI's sentinel for anything moved to asset safety. */
export const ASSET_SAFETY_ID = 2004;

/**
 * A character's assets: loose stacks and nested containers at a station, a Deliveries
 * compartment, a stack in a player structure, a module fitted to a ship that is in space, and an
 * asset safety wrap.
 */
export const characterAssetRows = [
  {
    item_id: 1001,
    type_id: 34,
    quantity: 1000,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 1002,
    type_id: 3465,
    quantity: 1,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 1003,
    type_id: 35,
    quantity: 500,
    location_flag: "Unlocked",
    location_id: 1002,
    location_type: "item",
  },
  {
    item_id: 1004,
    type_id: 3465,
    quantity: 1,
    location_flag: "Unlocked",
    location_id: 1002,
    location_type: "item",
  },
  {
    item_id: 1005,
    type_id: 36,
    quantity: 10,
    location_flag: "Unlocked",
    location_id: 1004,
    location_type: "item",
  },
  {
    item_id: 1006,
    type_id: 34,
    quantity: 25,
    location_flag: "Deliveries",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 1007,
    type_id: 3465,
    quantity: 1,
    location_flag: "Deliveries",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 1008,
    type_id: 40,
    quantity: 7,
    location_flag: "Unlocked",
    location_id: 1007,
    location_type: "item",
  },
  {
    item_id: 1009,
    type_id: 34,
    quantity: 3,
    location_flag: "AssetSafety",
    location_id: ASSET_SAFETY_ID,
    location_type: "other",
  },
  // A structure arrives with location_type "item", the same value a container carries, so only
  // the id range separates them.
  {
    item_id: 1011,
    type_id: 34,
    quantity: 60,
    location_flag: "Hangar",
    location_id: RAITARU_STRUCTURE_ID,
    location_type: "item",
  },
  // The asset endpoint returns a ship's fitting but not the ship itself while it is in space, so
  // item 1010's holder is legitimately absent from the set.
  {
    item_id: 1010,
    type_id: 2048,
    quantity: 1,
    location_flag: "LoSlot0",
    location_id: 1099999999999,
    location_type: "item",
  },
];

/**
 * A corporation office at the same station: the office folder, a crate in division 3 holding a
 * stack, and a stack sitting directly in division 1.
 */
export const corporationAssetRows = [
  {
    item_id: 2001,
    type_id: 27,
    quantity: 1,
    location_flag: "OfficeFolder",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 2002,
    type_id: 3465,
    quantity: 1,
    location_flag: "CorpSAG3",
    location_id: 2001,
    location_type: "item",
  },
  {
    item_id: 2003,
    type_id: 34,
    quantity: 250,
    location_flag: "Unlocked",
    location_id: 2002,
    location_type: "item",
  },
  {
    item_id: 2004,
    type_id: 35,
    quantity: 99,
    location_flag: "CorpSAG1",
    location_id: 2001,
    location_type: "item",
  },
];

export const OIJAMON_SYSTEM_ID = 30000001;
export const OWNED_STRUCTURE_ID = 1041234567890;

/**
 * A corporation that owns the structure it keeps its office in: ESI returns the structure as one of
 * the corporation's own assets, sitting in the solar system, with the office folder inside it.
 *
 * What the structure's own row carries as a `location_flag` does not matter here — it sits in a
 * system, which is never an asset row, so its chain ends there whatever the flag says. The office
 * inside it is what the resolution rule turns on. A stack directly in the structure's hangar is
 * held here too, as the same reading applies to it.
 */
export const corporationOwnedStructureRows = [
  {
    item_id: OWNED_STRUCTURE_ID,
    type_id: 35832,
    quantity: 1,
    location_flag: "StructureActive",
    location_id: OIJAMON_SYSTEM_ID,
    location_type: "solar_system",
  },
  {
    item_id: 2103,
    type_id: 34,
    quantity: 900,
    location_flag: "Hangar",
    location_id: OWNED_STRUCTURE_ID,
    location_type: "item",
  },
  {
    item_id: 2101,
    type_id: 27,
    quantity: 1,
    location_flag: "OfficeFolder",
    location_id: OWNED_STRUCTURE_ID,
    location_type: "item",
  },
  {
    item_id: 2102,
    type_id: 686,
    quantity: 1,
    location_flag: "CorpSAG1",
    location_id: 2101,
    location_type: "item",
  },
];

/**
 * A hangar holding a fitted ship, a packaged one, and a crate — the three things that have to be
 * told apart before an assembled ship can be hidden.
 *
 * 7001 is assembled: modules in fitting slots, drones, and ore in a specialised hold. 7005 is the
 * same hull packaged, which ESI gives as a plain stack. 7006 is a container, which holds things
 * without being a ship. 7008 is an assembled hull with nothing fitted and nothing aboard, which
 * only its category tells apart from a crate. 7010 is a structure the corporation owns, rigged but
 * not a ship.
 */
export const assembledShipAssetRows = [
  {
    item_id: 7001,
    type_id: 587,
    quantity: 1,
    is_singleton: true,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 7002,
    type_id: 2048,
    quantity: 1,
    location_flag: "LoSlot0",
    location_id: 7001,
    location_type: "item",
  },
  {
    item_id: 7003,
    type_id: 2456,
    quantity: 5,
    location_flag: "DroneBay",
    location_id: 7001,
    location_type: "item",
  },
  {
    item_id: 7004,
    type_id: 34,
    quantity: 400,
    location_flag: "SpecializedOreHold",
    location_id: 7001,
    location_type: "item",
  },
  {
    item_id: 7005,
    type_id: 587,
    quantity: 3,
    is_singleton: false,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 7006,
    type_id: 3465,
    quantity: 1,
    is_singleton: true,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 7007,
    type_id: 35,
    quantity: 20,
    location_flag: "Unlocked",
    location_id: 7006,
    location_type: "item",
  },
  {
    item_id: 7008,
    type_id: 622,
    quantity: 1,
    is_singleton: true,
    location_flag: "Hangar",
    location_id: JITA_STATION_ID,
    location_type: "station",
  },
  {
    item_id: 7010,
    type_id: 35832,
    quantity: 1,
    location_flag: "StructureActive",
    location_id: OIJAMON_SYSTEM_ID,
    location_type: "solar_system",
  },
  {
    item_id: 7011,
    type_id: 43711,
    quantity: 1,
    location_flag: "RigSlot0",
    location_id: 7010,
    location_type: "item",
  },
  {
    item_id: 7012,
    type_id: 4051,
    quantity: 400,
    location_flag: "StructureFuel",
    location_id: 7010,
    location_type: "item",
  },
];

/** A row whose holder is absent, as a member with partial visibility sees it. */
export const orphanedAssetRow = {
  item_id: 3001,
  type_id: 34,
  quantity: 12,
  location_flag: "Unlocked",
  location_id: 999999,
  location_type: "item",
};

/** A stack sitting in space in a wormhole system, and one in an abyssal pocket. */
export const inSpaceAssetRows = [
  {
    item_id: 5001,
    type_id: 34,
    quantity: 5,
    location_flag: "Hangar",
    location_id: 31000123,
    location_type: "solar_system",
  },
  {
    item_id: 5002,
    type_id: 34,
    quantity: 5,
    location_flag: "Hangar",
    location_id: 32000456,
    location_type: "solar_system",
  },
];

/** A row claiming to hold itself. */
export const selfHoldingAssetRow = {
  item_id: 6001,
  type_id: 3465,
  quantity: 1,
  location_flag: "Hangar",
  location_id: 6001,
  location_type: "item",
};

/**
 * Two rows holding each other — malformed, and must not recurse forever. Row 4003 is well formed
 * and hangs beneath the cycle, so it must keep its holder rather than being cut loose with it.
 */
export const cyclicAssetRows = [
  {
    item_id: 4001,
    type_id: 3465,
    quantity: 1,
    location_flag: "Unlocked",
    location_id: 4002,
    location_type: "item",
  },
  {
    item_id: 4002,
    type_id: 3465,
    quantity: 1,
    location_flag: "Unlocked",
    location_id: 4001,
    location_type: "item",
  },
  {
    item_id: 4003,
    type_id: 34,
    quantity: 8,
    location_flag: "Unlocked",
    location_id: 4001,
    location_type: "item",
  },
];

/**
 * What the static item list says about the fixture types, as far as the asset views ask of it: the
 * inventory category, which is the only thing that names a hull holding nothing as a ship.
 */
export const assetFixtureItemList = {
  34: { name: "Tritanium", category_id: 4 },
  35: { name: "Pyerite", category_id: 4 },
  36: { name: "Mexallon", category_id: 4 },
  587: { name: "Rifter", category_id: 6 },
  622: { name: "Stabber", category_id: 6 },
  2048: { name: "Damage Control II", category_id: 7 },
  2456: { name: "Hobgoblin I", category_id: 18 },
  3465: { name: "Large Secure Container", category_id: 2 },
  35832: { name: "Astrahus", category_id: 65 },
};
