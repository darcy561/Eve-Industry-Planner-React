import { Box, Stack, Typography } from "@mui/material";

import { RangeBar } from "../../../../../../Styled Components/Charts";
import {
  FigureCaption,
  SignedPercent,
} from "../../../../../../Styled Components/Typography/figures";
import { monthLabel } from "../Archive Jobs Panel/buildHistoryFigures";

/**
 * This build's cost placed among the ones already archived.
 *
 * Stands beside the headline rather than under it: it qualifies the cost per
 * unit, and a reader who has never archived a build should meet the cost itself
 * without an empty comparison beside it.
 *
 * @param {object} props
 * @param {ReturnType<import("../../../../../../Functions/MarketData/buildComparison").compareToHistory>} props.comparison
 * @param {(value: number) => string} props.formatIsk
 */
export default function CostComparison({ comparison, formatIsk }) {
  const { bar, delta, last, outside, average, builds } = comparison ?? {};

  // A first build is information: it says the estimate has nothing to be checked
  // against, which is the same thing a signed-out reader sees.
  if (!comparison || builds < 1) {
    return (
      <Box sx={{ minWidth: 180, maxWidth: 260, flex: "1 1 180px" }}>
        <Box
          sx={{
            border: 1,
            borderStyle: "dashed",
            borderColor: "divider",
            borderRadius: 1.5,
            p: 1.25,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No archived builds of this item yet — nothing to compare against.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 180, maxWidth: 260, flex: "1 1 180px" }}>
      <FigureCaption>Against your builds</FigureCaption>
      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
        {bar ? (
          <RangeBar
            low={bar.low}
            high={bar.high}
            value={bar.value}
            average={bar.average}
            label={`Cost per unit ${formatIsk(bar.value)}, against ${formatIsk(bar.low)} to ${formatIsk(bar.high)} across ${builds} builds`}
            labels={[formatIsk(bar.low), formatIsk(bar.high)]}
            middleLabel={`your ${builds} builds`}
          />
        ) : null}

        {bar ? (
          <Typography variant="caption" color="text.secondary">
            Average {formatIsk(average)} · this build {formatIsk(bar.value)}
          </Typography>
        ) : null}

        {outside ? (
          <Typography variant="caption" color="text.secondary">
            {outside === "below"
              ? "Cheaper than any build you have archived"
              : "Dearer than any build you have archived"}
          </Typography>
        ) : null}

        {last ? (
          <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
            <Typography variant="caption" color="text.secondary">
              vs last build
              {monthLabel(last.month) ? ` (${monthLabel(last.month)})` : ""}
            </Typography>
            <SignedPercent value={delta?.share ?? null} variant="caption" />
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
