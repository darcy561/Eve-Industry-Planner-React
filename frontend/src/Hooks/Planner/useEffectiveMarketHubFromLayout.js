import { useMemo } from "react";
import useUsersStore from "../../Zustand/usersStore.js";
import { resolvePricingSide } from "../../Functions/MarketData/pricingSide.js";

/**
 * Where one side of a job is priced, from the job's own choice down to the
 * global default.
 *
 * The side is the caller's to name: a surface knows whether it is asking what
 * something costs to buy or what it fetches when sold, and nothing here can
 * infer it.
 *
 * @param {object} layout - The job's layout
 * @param {string} side - One of PRICING_SIDE
 * @returns {{marketDisplay: string, orderDisplay: string}}
 */
export function useEffectiveMarketHubFromLayout(layout, side) {
  const accountPricing = useUsersStore(
    (s) => s.applicationSettings.defaultPricing,
  );
  const jobPricing = layout?.localPricing;

  return useMemo(
    () => resolvePricingSide({ jobPricing, accountPricing, side }),
    [jobPricing, accountPricing, side],
  );
}
