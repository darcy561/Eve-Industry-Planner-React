import GLOBAL_CONFIG from "../../global-config-app";

const { MARKET_OPTIONS } = GLOBAL_CONFIG;

/**
 * The kinds of location a job can be sold from. A preset hub's broker fee is
 * derived from the seller's skills and standings; a structure's is the rate its
 * owner set, which only the player can supply.
 *
 * @enum {string}
 */
export const SALE_LOCATION_KIND = {
  HUB: "hub",
  STRUCTURE: "structure",
};

/**
 * Stand-ins for saved citadels, so the panels that price a sale can be built and
 * tested before the stored list exists.
 *
 * Deliberately not exported: they carry the full shape a stored row will, and
 * every caller reaches them through the functions below, so replacing the source
 * with the stored list is a change to this file alone.
 *
 * There are two, and they disagree on every field that changes a figure — fee,
 * hub, and which is the default — so a consumer that quietly assumes one
 * citadel, or reads the default where it should read the chosen row, produces a
 * visibly wrong number rather than a coincidentally right one.
 *
 * @type {SaleStructure[]}
 */
const PLACEHOLDER_SALE_STRUCTURES = [
  {
    id: "placeholder-sale-structure",
    structureID: 1035466617946,
    name: "Placeholder Citadel",
    brokerFee: 1.5,
    priceHub: "jita",
    default: true,
  },
  {
    id: "placeholder-sale-structure-2",
    structureID: 1041366702033,
    name: "Second Placeholder Citadel",
    brokerFee: 3.25,
    priceHub: "amarr",
    default: false,
  },
];

/**
 * @typedef {object} SaleStructure
 * @property {string} id - Stable id of the saved row
 * @property {number} structureID - The in-game structure
 * @property {string} name - What the structure is called
 * @property {number} brokerFee - The rate its owner set, as a percentage
 * @property {string} priceHub - Which MARKET_OPTIONS id its figures price against
 * @property {boolean} default - Whether it is the one used when none is chosen
 */

/**
 * @typedef {object} SaleLocation
 * @property {string} kind - One of SALE_LOCATION_KIND
 * @property {string} id - Hub id, or the saved row's id
 * @property {string} name - Display name
 * @property {number} priceHubStationID - The station whose prices apply
 * @property {number|null} brokerFee - The owner's rate for a structure; null at a
 *   hub, where the rate is derived from the seller instead
 */

/**
 * The saved citadels a player can sell from.
 *
 * @returns {SaleStructure[]}
 */
export function getSaleStructures() {
  return PLACEHOLDER_SALE_STRUCTURES;
}

/**
 * The saved citadel used when a job names none.
 *
 * @returns {SaleStructure|null}
 */
export function getDefaultSaleStructure() {
  const structures = getSaleStructures();
  return structures.find((i) => i.default) ?? structures[0] ?? null;
}

/**
 * Normalises a hub or a saved citadel into the one shape a caller pricing a sale
 * reads, so neither kind is handled twice.
 *
 * @param {string|null} [saleStructureID] - A saved row's id, or null for a hub
 * @param {string} [hubID] - A MARKET_OPTIONS id, used when no structure is named
 * @returns {SaleLocation|null}
 */
export function resolveSaleLocation(saleStructureID, hubID) {
  if (saleStructureID) {
    const structure = getSaleStructures().find((i) => i.id === saleStructureID);
    if (structure) return saleLocationFromStructure(structure);
  }

  const hub =
    MARKET_OPTIONS.find((i) => i.id === hubID) ??
    MARKET_OPTIONS.find((i) => i.id === GLOBAL_CONFIG.DEFAULT_MARKET_OPTION);
  if (!hub) return null;

  return {
    kind: SALE_LOCATION_KIND.HUB,
    id: hub.id,
    name: hub.name,
    priceHubStationID: hub.stationID,
    brokerFee: null,
  };
}

/**
 * @param {SaleStructure} structure
 * @returns {SaleLocation}
 */
function saleLocationFromStructure(structure) {
  // A structure has no market of its own, so its figures price against a hub.
  const hub =
    MARKET_OPTIONS.find((i) => i.id === structure.priceHub) ??
    MARKET_OPTIONS.find((i) => i.id === GLOBAL_CONFIG.DEFAULT_MARKET_OPTION);

  return {
    kind: SALE_LOCATION_KIND.STRUCTURE,
    id: structure.id,
    name: structure.name,
    priceHubStationID: hub?.stationID ?? null,
    brokerFee: structure.brokerFee,
  };
}
