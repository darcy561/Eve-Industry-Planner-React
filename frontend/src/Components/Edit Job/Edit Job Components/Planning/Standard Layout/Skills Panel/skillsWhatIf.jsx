import { Box, Stack, Typography } from "@mui/material";

import InsetSurface from "../../../../../../Styled Components/Paper/InsetSurface";
import {
  FIGURE_TONE,
  FigureCaption,
  FigureRow,
} from "../../../../../../Styled Components/Typography/figures";
import {
  formatNumberForLocale,
  formatPercentage,
} from "../../../../../../Functions/Helper/numberParser";
import { sellingWhatIf } from "../../../../../../Functions/MarketOrders/sellingWhatIf";
import { marketSkillIDs } from "../../../../../../Context/defaultValues";
import Superseded from "./superseded";

/**
 * What the levels being tried would be worth on this job.
 *
 * The levels themselves are raised on the rows above; this states the
 * consequence. It reads them and computes — nothing here is written anywhere, so
 * Cost Breakdown and Returns go on stating what the player's real skills cost
 * them, and a figure that only ever existed inside a what-if is never the one
 * they come back to.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketOrders/sellingRates").BrokerFeeWorking} props.brokerFee
 * @param {{base: number, accounting: number, rate: number}} props.salesTax
 * @param {number} props.listedValue - ISK the listing is worth
 * @param {number} props.quantity - Units being sold
 * @param {Object<number, number>} props.proposed - Levels being tried
 */
export default function SkillsWhatIf({
  brokerFee,
  salesTax,
  listedValue,
  quantity,
  proposed,
}) {
  if (!brokerFee || !salesTax) return null;

  const trained = {
    brokerRelations:
      brokerFee.terms?.find((t) => t.id === "brokerRelations")?.level ?? 0,
    accounting: salesTax.accounting ?? 0,
  };
  const asked = {
    brokerRelations:
      proposed[marketSkillIDs.brokerRelations] ?? trained.brokerRelations,
    accounting: proposed[marketSkillIDs.accounting] ?? trained.accounting,
  };

  const now = sellingWhatIf({
    brokerFee,
    salesTax,
    listedValue,
    quantity,
    proposed: trained,
  });
  const then = sellingWhatIf({
    brokerFee,
    salesTax,
    listedValue,
    quantity,
    proposed: asked,
  });

  const changed =
    asked.brokerRelations !== trained.brokerRelations ||
    asked.accounting !== trained.accounting;

  return (
    <Box>
      <FigureCaption>What selling costs</FigureCaption>
      <Stack sx={{ mt: 0.5 }}>
        <FigureRow
          label="Broker fee"
          sublabel={
            then.brokerFeeApplies
              ? undefined
              : "not applied here — a structure's fee is its owner's"
          }
          value={
            <Superseded
              was={formatPercentage(now.brokerFee.rate / 100, { places: 2 })}
              is={formatPercentage(then.brokerFee.rate / 100, { places: 2 })}
              changed={changed && now.brokerFee.rate !== then.brokerFee.rate}
            />
          }
        />
        <FigureRow
          label="Sales tax"
          value={
            <Superseded
              was={formatPercentage(now.salesTax.rate / 100, { places: 3 })}
              is={formatPercentage(then.salesTax.rate / 100, { places: 3 })}
              changed={changed && now.salesTax.rate !== then.salesTax.rate}
            />
          }
        />
        <FigureRow
          label="Charged on this build"
          isTotal
          tone={
            !changed || then.saved === 0
              ? FIGURE_TONE.PLAIN
              : then.saved > 0
                ? FIGURE_TONE.GOOD
                : FIGURE_TONE.BAD
          }
          value={
            <Superseded
              was={formatNumberForLocale(now.brokerFee.amount + now.salesTax.amount)}
              is={formatNumberForLocale(then.brokerFee.amount + then.salesTax.amount)}
              changed={changed && then.saved !== 0}
            />
          }
        />
      </Stack>

      {/* Always occupies its line: a caption that appears only once a level is
          tried grows the panel underneath the control being clicked. */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: "block" }}
      >
        {changed && then.saved !== 0
          ? `Worth ${formatNumberForLocale(Math.abs(then.saved))} on each build at this size${
              then.breakEvenPerUnit === null
                ? ""
                : `, and moves break-even ${formatNumberForLocale(Math.abs(then.breakEvenPerUnit))} a unit`
            }.`
          : "Raise a level on a row above to see what it would be worth."}
      </Typography>
    </Box>
  );
}
