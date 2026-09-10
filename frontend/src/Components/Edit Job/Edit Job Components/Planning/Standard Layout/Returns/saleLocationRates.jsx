import { Skeleton, Stack, Typography } from "@mui/material";

import InsetSurface from "../../../../../../Styled Components/Paper/InsetSurface";
import {
  FigureCaption,
  FigureRow,
} from "../../../../../../Styled Components/Typography/figures";
import { formatPercentage } from "../../../../../../Functions/Helper/numberParser";
import { SALE_LOCATION_KIND } from "../../../../../../Functions/MarketOrders/saleLocations";

/**
 * Where the build is sold from, and what selling there costs.
 *
 * A station shows every subtraction, because those come from the player's own
 * character and seeing them is what makes the figure trustworthy. A citadel
 * shows one line and says Broker Relations does not apply — the absence of any
 * working is itself the information.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketOrders/saleLocations").SaleLocation} props.saleLocation
 * @param {{brokerFee: import("../../../../../../Functions/MarketOrders/sellingRates").BrokerFeeWorking,
 *   salesTax: {base: number, accounting: number, rate: number}}} [props.rates]
 * @param {import("../../../../../../Functions/MarketOrders/sellerCharacter").SellerCharacter} [props.seller] -
 *   Whose skills and standings are quoted
 * @param {string} [props.priceHubName] - Named for a citadel, whose prices come
 *   from a hub rather than from itself
 * @param {boolean} [props.isLoading]
 */
export default function SaleLocationRates({
  saleLocation,
  rates,
  seller,
  priceHubName,
  isLoading = false,
}) {
  if (!saleLocation) return null;

  const atStructure = saleLocation.kind === SALE_LOCATION_KIND.STRUCTURE;

  return (
    <InsetSurface>
      <FigureCaption>Selling from</FigureCaption>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {saleLocation.name}
      </Typography>
      {atStructure && priceHubName ? (
        <Typography variant="caption" color="text.secondary">
          Prices from {priceHubName}; the fee is this structure's own
        </Typography>
      ) : null}

      {isLoading || !rates ? (
        <Stack sx={{ mt: 1 }}>
          <Skeleton width="70%" />
          <Skeleton width="50%" />
        </Stack>
      ) : (
        <Stack sx={{ mt: 1 }}>
          {atStructure ? (
            <>
              <FigureRow
                label="Broker fee"
                sublabel="the rate this structure's owner set"
                value={formatPercentage(fraction(rates.brokerFee.rate), {
                  places: 2,
                })}
              />
              <Typography variant="caption" color="text.secondary">
                Broker Relations does not reduce a structure's fee, and there is
                no standing to hold with its owner.
              </Typography>
            </>
          ) : (
            <>
              <FigureRow
                label="Broker fee, base"
                value={formatPercentage(fraction(rates.brokerFee.base), {
                  places: 2,
                })}
              />
              {rates.brokerFee.terms.map((term) => (
                <FigureRow
                  key={term.id}
                  label={term.label}
                  sublabel={termDetail(term)}
                  value={
                    term.amount === 0
                      ? null
                      : `−${formatPercentage(fraction(term.amount), { places: 2 })}`
                  }
                />
              ))}
              <FigureRow
                label="Broker fee"
                isTotal
                value={formatPercentage(fraction(rates.brokerFee.rate), {
                  places: 2,
                })}
              />
            </>
          )}

          <FigureRow
            label="Sales tax"
            sublabel={
              rates.salesTax.accounting > 0
                ? `Accounting ${rates.salesTax.accounting}, from a base of ${formatPercentage(fraction(rates.salesTax.base), { places: 2 })}`
                : "no Accounting trained"
            }
            value={formatPercentage(fraction(rates.salesTax.rate), {
              places: 3,
            })}
          />
        </Stack>
      )}

      {seller?.name ? (
        <Typography variant="caption" color="text.secondary">
          Quoted for {seller.name}
          {seller.isDefault
            ? " — your main. Market skills and standings are the seller's, and a job cannot yet name one."
            : ""}
        </Typography>
      ) : null}
    </InsetSurface>
  );
}

/**
 * What a term took off, and what it took it off for.
 *
 * A standing of zero is worth stating rather than hiding: it is the difference
 * between a reduction the player has not earned and one the app failed to read.
 *
 * @param {import("../../../../../../Functions/MarketOrders/sellingRates").FeeTerm} term
 */
function termDetail(term) {
  if (term.id === "brokerRelations") {
    return term.level > 0 ? `level ${term.level}` : "untrained";
  }
  return term.level > 0
    ? `standing ${term.level.toFixed(2)}`
    : "no standing with them";
}

/**
 * The rates are percentages; `formatPercentage` takes a fraction. Every line in
 * the fee block is written to the same two places, because they are read down a
 * column and a ragged one reads as figures of different kinds.
 */
const fraction = (percentage) => percentage / 100;
