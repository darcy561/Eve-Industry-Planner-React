import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useGetCharacterSkills } from "../../EveEsi/Character/useGetCharacterSkills";
import { useGetCharacterStandings } from "../../EveEsi/Character/useGetCharacterStandings";
import {
  brokerFeeWorking,
  salesTaxWorking,
} from "../../../Functions/MarketOrders/sellingRates";

/**
 * What it costs a character to list and sell at a location, with the working
 * behind each rate.
 *
 * Subscribes to the skills and standings queries rather than only reading their
 * caches. `sellingRates` reads them through their cached accessors, which never
 * start a fetch — and outside the Selling stage nothing else mounts the standings
 * query, so a station fee worked out without this would quote every seller as
 * having no standings at all.
 *
 * @param {import("../../../Functions/MarketOrders/saleLocations").SaleLocation|null} saleLocation
 * @param {string|null} characterHash
 */
export function useSellingRates(saleLocation, characterHash) {
  const queryClient = useQueryClient();
  const skills = useGetCharacterSkills(characterHash);
  const standings = useGetCharacterStandings(characterHash);

  const settled = !characterHash || (!skills.isLoading && !standings.isLoading);

  return useQuery({
    // The reads are cache lookups made inside the query function, so what they
    // returned is not otherwise part of the key: without these the first result
    // would be cached against skills that had not arrived yet.
    queryKey: [
      "sellingRates",
      saleLocation?.kind ?? "none",
      saleLocation?.id ?? "none",
      saleLocation?.priceHubStationID ?? "none",
      characterHash ?? "none",
      skills.dataUpdatedAt,
      standings.dataUpdatedAt,
    ],
    queryFn: async () => ({
      brokerFee: await brokerFeeWorking(saleLocation, queryClient, characterHash),
      salesTax: salesTaxWorking(queryClient, characterHash),
    }),
    enabled: Boolean(saleLocation) && settled,
  });
}
