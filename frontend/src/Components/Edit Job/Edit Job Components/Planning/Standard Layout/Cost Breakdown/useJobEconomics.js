import { useMemo } from "react";
import { getJobInstallCostForPlanning } from "../../../../../../Functions/Installation Costs/installCosts";
import { buildCostBreakdown } from "../../../../../../Functions/MarketData/costBreakdown";
import { calculateReturns } from "../../../../../../Functions/MarketData/returns";
import { compareToHistory } from "../../../../../../Functions/MarketData/buildComparison";
import {
  brokerFeeAmount,
  salesTaxAmount,
} from "../../../../../../Functions/MarketOrders/sellingRates";
import {
  getDefaultSaleStructure,
  resolveSaleLocation,
} from "../../../../../../Functions/MarketOrders/saleLocations";
import { useSellingRates } from "../../../../../../Hooks/React Query/Character/useSellingRates";
import { useAccountTotalsQuery } from "../../../../../../Hooks/React Query/Backend/statisticsTotals";
import { formatPercentage } from "../../../../../../Functions/Helper/numberParser";
import { getMarketPriceForType } from "../Material Prices/marketPriceHelpers";
import { resolveSellerCharacter } from "../../../../../../Functions/MarketOrders/sellerCharacter";
import { useJobCommitment } from "../../../../../../Hooks/Planner/useJobCommitment";

/**
 * The figures Cost Breakdown and Returns both draw from.
 *
 * One place because the two panels must agree: a cost to build stated on one and
 * subtracted on the other has to be the same number, and it stops being so the
 * moment each panel totals the rows itself.
 *
 * @param {object} params
 * @param {object} params.state - Edit Job state
 * @param {object} params.actions - Edit Job actions
 * @param {Array<object>} params.rows - Rows from useMaterialsSourcing
 * @param {string} params.marketSelect
 * @param {boolean} [params.buyEverything] - Price every material at market
 */
export function useJobEconomics({
  state,
  actions,
  rows,
  marketSelect,
  buyEverything = false,
}) {
  const { activeJob } = state;

  // The planner's default citadel is the one every job sells from; a job cannot
  // name its own.
  const saleLocation = useMemo(
    () => resolveSaleLocation(getDefaultSaleStructure()?.id, marketSelect),
    [marketSelect],
  );

  // The seller, not the builder. Market skills and standings live on whichever
  // character lists the order, which is routinely a trading alt rather than the
  // one the setup runs the job on.
  const seller = resolveSellerCharacter();

  const { data: rates, isLoading: ratesLoading } = useSellingRates(
    saleLocation,
    seller.hash,
  );
  const { data: totalsData } = useAccountTotalsQuery(activeJob.itemID);

  const commitment = useJobCommitment({ state, actions });

  return useMemo(() => {
    const quantityProduced = activeJob.totalQuantityProduced ?? 0;

    // Output owed to a parent is never listed, so it has no sale price, no fee
    // and no tax. Only what is left over can honestly be sold.
    const sellable = commitment.surplus;

    // Both routes out are priced from the location's own hub, which for a
    // citadel is not the citadel: it holds no market of its own.
    const priceHub = saleLocation?.priceHubID ?? marketSelect;
    const sellPrice = getMarketPriceForType(activeJob.itemID, priceHub, "sell");
    const buyPrice = getMarketPriceForType(activeJob.itemID, priceHub, "buy");

    // The fee is charged on what the listing is worth, which is the sell-side
    // revenue of what is actually going to be listed.
    const listedValue = sellPrice * sellable;
    // Nothing listed is charged nothing. The fee has a 100 ISK floor, which
    // would otherwise bill a job whose whole output is owed to a parent for a
    // listing it never makes.
    const charged = rates && sellable > 0;
    const brokerFee = charged
      ? brokerFeeAmount(rates.brokerFee.rate, listedValue)
      : 0;
    const salesTax = charged
      ? salesTaxAmount(rates.salesTax.rate, listedValue)
      : 0;

    const cost = buildCostBreakdown({
      rows,
      installCost: getJobInstallCostForPlanning(activeJob),
      extras: activeJob.totalExtrasCost ?? 0,
      brokerFee,
      salesTax,
      quantityProduced,
      buyEverything,
      sellDetail: rates
        ? {
            brokerFee: `${formatPercentage(rates.brokerFee.rate / 100, { places: 2 })} at ${saleLocation?.name}`,
            salesTax: formatPercentage(rates.salesTax.rate / 100, { places: 3 }),
          }
        : {},
    });

    return {
      cost,
      saleLocation,
      priceHub,
      rates,
      ratesLoading,
      seller,
      sellPrice,
      commitment,
      // The marks themselves, for a consumer that needs the months rather than
      // the comparison drawn from them.
      history: totalsData?.history,
      // The share of the build cost belonging to what can actually be sold.
      // Returns states it and subtracts it, and the two must be the same figure.
      sellableBuildCost: (cost.toBuild.perUnit ?? 0) * sellable,
      // Returns is about the part that gets sold. Its build cost is that part's
      // share rather than the whole job's, or a job that owes most of its output
      // to a parent would read as a heavy loss on the little it can sell.
      returns:
        sellable > 0
          ? calculateReturns({
              sellPrice,
              buyPrice,
              quantityProduced: sellable,
              buildCost: (cost.toBuild.perUnit ?? 0) * sellable,
              brokerFee,
              salesTax,
            })
          : null,
      // What the committed output costs the parents above it — the figure that
      // replaces a sale price when there is nothing to sell.
      contributedCost: (cost.toBuild.perUnit ?? 0) * commitment.committed,
      // The archive's marks are build cost per unit, so the comparison is made
      // against the build band rather than the total.
      comparison: compareToHistory(totalsData?.history, cost.toBuild.perUnit),
      charges: { brokerFee, salesTax },
    };
  }, [
    activeJob,
    buyEverything,
    commitment,
    marketSelect,
    rates,
    ratesLoading,
    rows,
    saleLocation,
    seller,
    totalsData,
  ]);
}
