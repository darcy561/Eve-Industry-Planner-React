import { Box, Stack, Typography } from "@mui/material";

import AppShellPanel from "../../../../../../Styled Components/Paper/AppShellPanel";
import InsetSurface from "../../../../../../Styled Components/Paper/InsetSurface";
import { FigureCaption } from "../../../../../../Styled Components/Typography/figures";
import {
  ContextRow,
  Disclosure,
  FIGURE_TONE,
  FigureRow,
  HeadlineStat,
  PanelHeadline,
} from "../../../../../../Styled Components/Typography/figures";
import {
  formatNumberForLocale,
  formatPercentage,
} from "../../../../../../Functions/Helper/numberParser";
import { monthLabel } from "../Archive Jobs Panel/buildHistoryFigures";
import ExitRoutes, { signTone } from "./exitRoutes";
import OutputHeader from "./outputHeader";

/**
 * What the build is worth selling, by each way out of it.
 *
 * The model states every figure against a route and picks none; this panel makes
 * that choice and names it, so a margin on screen always belongs to a route the
 * reader can see.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/returns").Returns} props.returns
 * @param {string} [props.headlineRouteID] - Which route the panel leads with
 * @param {{brokerFee: number, salesTax: number}} props.charges - ISK, for the ledger
 * @param {number} props.buildCost - ISK, selling excluded
 * @param {ReturnType<import("../../../../../../Functions/MarketData/buildComparison").compareToHistory>} [props.comparison]
 * @param {object} [props.output] - What the job makes, for the header
 * @param {React.ReactNode} [props.action] - Shown in the panel header
 * @param {React.ReactNode} [props.children] - The sale location and its rates
 */
export default function ReturnsPanel({
  returns,
  headlineRouteID = "listed",
  charges,
  buildCost,
  comparison,
  output,
  action,
  children,
}) {
  if (!returns) return null;

  const headline =
    returns.routes.find((i) => i.id === headlineRouteID) ?? returns.routes[0];
  if (!headline) return null;

  return (
    <AppShellPanel
      title="Returns"
      componentName="ReturnsPanel"
      // Every panel on this stage sits in a Masonry that measures it, and a
      // panel filling an undecided height grows without bound.
      paperSx={{ height: "auto" }}
      action={action}
    >
      <Stack spacing={2}>
        {output ? <OutputHeader {...output} /> : null}

        {/* The headline sits on its own surface: it is the panel's answer, and
            it should read as one rather than as the first of several rows. */}
        <InsetSurface>
          <PanelHeadline
            aside={
              <Stack direction="row" spacing={3}>
                <HeadlineStat
                  caption="Per unit"
                  size="beside"
                  tone={signTone(headline.perUnit)}
                  value={
                    headline.perUnit === null
                      ? null
                      : formatNumberForLocale(headline.perUnit)
                  }
                />
                <HeadlineStat
                  caption="Margin"
                  size="beside"
                  tone={signTone(headline.margin)}
                  value={formatPercentage(headline.margin)}
                />
                <HeadlineStat
                  caption="Return on outlay"
                  size="beside"
                  tone={signTone(headline.returnOnOutlay)}
                  value={formatPercentage(headline.returnOnOutlay)}
                />
              </Stack>
            }
          >
            <HeadlineStat
              caption={`Net return — ${headline.label.toLowerCase()}`}
              tone={signTone(headline.net)}
              value={formatNumberForLocale(headline.net)}
            />
          </PanelHeadline>
        </InsetSurface>

        <Box>
          <FigureCaption>Exit routes</FigureCaption>
          <Box sx={{ mt: 0.5 }}>
            <ExitRoutes routes={returns.routes} />
          </Box>
        </Box>

        <Stack>
          <ContextRow note={headroomNote(returns)}>
            {returns.breakEvenPerUnit === null
              ? "Nothing produced, so there is nothing to break even on"
              : `Each unit must fetch ${formatNumberForLocale(returns.breakEvenPerUnit)} to break even`}
          </ContextRow>

          <PreviousBuilds comparison={comparison} />
        </Stack>

        <Disclosure label="How this is worked out">
          <Ledger route={headline} charges={charges} buildCost={buildCost} />
        </Disclosure>

        {children}
      </Stack>
    </AppShellPanel>
  );
}

/**
 * What previous builds cost, stated without a verdict — the history is the
 * player's own, and a run of builds made in a poor market would make a bad
 * benchmark read as a good one.
 *
 * @param {object} props
 */
function PreviousBuilds({ comparison }) {
  if (!comparison || comparison.builds < 1) return null;

  const { range, last } = comparison;
  const month = monthLabel(last?.month);

  return (
    <ContextRow note={month ? `last built ${month}` : null}>
      {range
        ? `Your ${comparison.builds} previous builds cost ${formatNumberForLocale(range.low)} to ${formatNumberForLocale(range.high)} per unit`
        : `Your previous build cost ${formatNumberForLocale(last.perUnit)} per unit`}
    </ContextRow>
  );
}

/**
 * The working behind the headline: what the sale brings in, what is taken from
 * it, and what making it cost.
 *
 * Only the headline route's, because the fee is charged on a listing and the
 * route that does not list does not pay it — one ledger covering both would have
 * to state a charge that only sometimes applies.
 *
 * @param {object} props
 */
function Ledger({ route, charges, buildCost }) {
  const listed = route.id === "listed";

  return (
    <>
      <Typography variant="caption" color="text.secondary">
        {route.label}
      </Typography>
      <FigureRow label="Revenue" value={formatNumberForLocale(route.revenue)} />
      {listed ? (
        <FigureRow
          label="Broker fee"
          sublabel="charged when the order is listed"
          tone={FIGURE_TONE.BAD}
          value={`−${formatNumberForLocale(charges?.brokerFee ?? 0)}`}
        />
      ) : null}
      <FigureRow
        label="Sales tax"
        tone={FIGURE_TONE.BAD}
        value={`−${formatNumberForLocale(charges?.salesTax ?? 0)}`}
      />
      <FigureRow
        label="Cost to build"
        tone={FIGURE_TONE.BAD}
        value={`−${formatNumberForLocale(buildCost ?? 0)}`}
      />
      <FigureRow
        label="Net return"
        isTotal
        tone={signTone(route.net)}
        value={formatNumberForLocale(route.net)}
      />
    </>
  );
}

/**
 * How far today's price sits above what a unit must fetch.
 *
 * The figure that makes break-even worth stating: on its own it is a number a
 * reader has to compare against the price themselves.
 *
 * @param {import("../../../../../../Functions/MarketData/returns").Returns} returns
 */
function headroomNote({ headroom }) {
  if (!headroom || headroom.above === null) return null;

  return `current ${formatNumberForLocale(headroom.price)} · ${formatPercentage(
    Math.abs(headroom.above),
  )} ${headroom.above < 0 ? "below" : "above"} break-even`;
}
