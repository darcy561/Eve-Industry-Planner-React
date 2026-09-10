import {
  brokerFeeRates,
  marketSkillIDs,
  salesTaxRates,
} from "../../Context/defaultValues";
import getStationData from "../EveESI/World/getStationData";
import { getCachedCharacterSkills } from "../../Hooks/EveEsi/Character/useGetCharacterSkills";
import { getCachedCharacterStandings } from "../../Hooks/EveEsi/Character/useGetCharacterStandings";
import { SALE_LOCATION_KIND } from "./saleLocations";

/**
 * What it costs to list an item and to sell it. Each charge is a rate and an
 * amount rather than one figure, so a planned sale and a real order read the same
 * formula.
 */

/**
 * @typedef {object} SellerSkills
 * @property {number} brokerRelations - Active level, 0 when untrained or signed out
 * @property {number} accounting - Active level, 0 when untrained or signed out
 */

/**
 * A character's market skill levels, defaulting to untrained.
 *
 * A skill absent from `bpSkills.json` never reaches this map, so it reads as
 * untrained rather than as missing.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {string|null} characterHash
 * @returns {SellerSkills}
 */
export function getSellerSkills(queryClient, characterHash) {
  // Signed out is the absence of a character, not of a query client: guarding on
  // the client would turn a wiring mistake into a silently higher fee instead of
  // a thrown error.
  if (!characterHash) {
    return { brokerRelations: 0, accounting: 0 };
  }

  const { data } = getCachedCharacterSkills(queryClient, characterHash);

  return {
    brokerRelations: data?.[marketSkillIDs.brokerRelations]?.activeLevel ?? 0,
    accounting: data?.[marketSkillIDs.accounting]?.activeLevel ?? 0,
  };
}

/**
 * The percentage charged to list an item at a sale location.
 *
 * A citadel's rate is its owner's and is used as given — Broker Relations does not
 * reduce it, and there is no faction or NPC corporation to hold standing with. A
 * station's is derived from the seller instead, so the same station quotes two
 * characters different rates.
 *
 * @param {import("./saleLocations").SaleLocation} saleLocation
 * @param {import("@tanstack/react-query").QueryClient} [queryClient]
 * @param {string|null} [characterHash]
 * @returns {Promise<number>} Percentage
 */
export async function brokerFeeRate(saleLocation, queryClient, characterHash) {
  if (saleLocation?.kind === SALE_LOCATION_KIND.STRUCTURE) {
    return saleLocation.brokerFee;
  }

  const { brokerRelations } = getSellerSkills(queryClient, characterHash);
  const { faction, corporation } = await getStationStandings(
    saleLocation?.priceHubStationID,
    queryClient,
    characterHash
  );

  return (
    brokerFeeRates.base -
    brokerFeeRates.brokerRelations * brokerRelations -
    brokerFeeRates.factionStanding * faction -
    brokerFeeRates.corporationStanding * corporation
  );
}

/**
 * The percentage taken from a sale. It takes no location: tax has no station or
 * structure component, so it is the same wherever the sale happens.
 *
 * Accounting takes a fraction of the base per level rather than subtracting from
 * it, which is what puts the rate at 3.375% rather than 6.95% at level V.
 *
 * @param {import("@tanstack/react-query").QueryClient} [queryClient]
 * @param {string|null} [characterHash]
 * @returns {number} Percentage
 */
export function salesTaxRate(queryClient, characterHash) {
  const { accounting } = getSellerSkills(queryClient, characterHash);

  return salesTaxRates.base * (1 - salesTaxRates.accounting * accounting);
}

/**
 * What a listing costs in ISK, never less than the floor the game charges.
 *
 * @param {number} rate - Percentage, from brokerFeeRate
 * @param {number} value - Total ISK value of the order
 * @returns {number}
 */
export function brokerFeeAmount(rate, value) {
  return Math.max((rate / 100) * value, brokerFeeRates.minimumFee);
}

/**
 * What a sale is taxed in ISK. No floor: unlike the broker fee, tax scales all the
 * way down.
 *
 * @param {number} rate - Percentage, from salesTaxRate
 * @param {number} value - Total ISK value of the sale
 * @returns {number}
 */
export function salesTaxAmount(rate, value) {
  return (rate / 100) * value;
}

/**
 * The seller's standings with the faction and corporation owning a station.
 *
 * @param {number|null|undefined} stationID
 * @param {import("@tanstack/react-query").QueryClient} [queryClient]
 * @param {string|null} [characterHash]
 * @returns {Promise<{faction: number, corporation: number}>}
 */
async function getStationStandings(stationID, queryClient, characterHash) {
  const none = { faction: 0, corporation: 0 };
  if (!stationID || !characterHash) return none;

  const { data: standings } = getCachedCharacterStandings(
    queryClient,
    characterHash
  );
  const station = await getStationData(stationID);

  // Read through the station rather than guarding it: getStationData swallows its
  // own errors and resolves to null, so this is what turns a failed lookup into a
  // rejected promise. Defaulting to no standings instead would quote a plausible
  // fee the seller does not owe, and the Selling stage stores the fee it links.
  return {
    faction:
      standings?.find((i) => i.from_id === station.race_id)?.standing ?? 0,
    corporation:
      standings?.find((i) => i.from_id === station.owner)?.standing ?? 0,
  };
}
