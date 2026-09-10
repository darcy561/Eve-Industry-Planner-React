import { STATIONID_RANGE } from "../../Context/defaultValues";
import { SALE_LOCATION_KIND } from "./saleLocations";
import { brokerFeeAmount, brokerFeeRate } from "./sellingRates";

/**
 * Calculates broker fee for a market order.
 *
 * @param {object} marketOrder
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @param {number} citadelBrokersFee
 * @returns {Promise<number>}
 */
export default async function calcBrokersFee(
  marketOrder,
  queryClient,
  citadelBrokersFee
) {
  const atStation =
    marketOrder.location_id >= STATIONID_RANGE.low &&
    marketOrder.location_id <= STATIONID_RANGE.high;

  // A real order names where it was placed, so its location is turned into the
  // shape the shared rate function reads rather than the rate being worked out a
  // second way here.
  const saleLocation = atStation
    ? {
        kind: SALE_LOCATION_KIND.HUB,
        priceHubStationID: marketOrder.location_id,
        brokerFee: null,
      }
    : {
        kind: SALE_LOCATION_KIND.STRUCTURE,
        priceHubStationID: null,
        brokerFee: citadelBrokersFee,
      };

  const rate = await brokerFeeRate(
    saleLocation,
    queryClient,
    marketOrder.CharacterHash
  );

  return brokerFeeAmount(rate, marketOrder.price * marketOrder.volume_total);
}
