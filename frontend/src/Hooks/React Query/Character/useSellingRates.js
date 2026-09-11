import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useSellingRateInputs } from "./useSellingRateInputs";
import {
  brokerFeeWorking,
  salesTaxWorking,
} from "../../../Functions/MarketOrders/sellingRates";

/**
 * What it costs a character to list and sell at a location, with the working
 * behind each rate.
 *
 * Subscribes to the reads the rates are worked out from rather than only reading
 * their caches, through the same hook the Selling stage uses so the two cannot
 * subscribe to different things.
 *
 * @param {import("../../../Functions/MarketOrders/saleLocations").SaleLocation|null} saleLocation
 * @param {string|null} characterHash
 */
export function useSellingRates(saleLocation, characterHash) {
  const queryClient = useQueryClient();
  const inputs = useSellingRateInputs(characterHash);

  const settled = !characterHash || !inputs.isLoading;

  return useQuery({
    // The reads are cache lookups made inside the query function, so what they
    // returned is not otherwise part of the key: without this the first result
    // would be cached against levels that had not arrived yet.
    queryKey: [
      "sellingRates",
      saleLocation?.kind ?? "none",
      saleLocation?.id ?? "none",
      saleLocation?.priceHubStationID ?? "none",
      characterHash ?? "none",
      inputs.updatedAt,
    ],
    queryFn: async () => ({
      brokerFee: await brokerFeeWorking(
        saleLocation,
        queryClient,
        characterHash,
      ),
      salesTax: salesTaxWorking(queryClient, characterHash),
    }),
    enabled: Boolean(saleLocation) && settled,
  });
}
