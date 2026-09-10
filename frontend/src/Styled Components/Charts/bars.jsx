import { Box, Tooltip } from "@mui/material";

import { FIGURE_TONE, figureToneColour } from "../Typography/figures";

/**
 * The two bars the planning panels draw: where one figure sits among others, and
 * what a total is made of.
 *
 * Both are read at a glance beside the figures they describe, so neither carries
 * its own numbers — the panel states those.
 */

/**
 * Where this build sits between the cheapest and dearest the player has made.
 *
 * States a position, not a verdict: a history of building in a poor market would
 * make a bad benchmark read as a good one, so nothing here says whether being
 * low in the range is good.
 *
 * @param {object} props
 * @param {number} props.low
 * @param {number} props.high
 * @param {number} props.value - This build
 * @param {number} [props.average] - Marked separately where there is one
 * @param {string} [props.label] - Describes the bar to a reader who cannot see it
 */
export function RangeBar({ low, high, value, average, label }) {
  const span = high - low;
  const at = (figure) =>
    span > 0 ? `${Math.min(100, Math.max(0, ((figure - low) / span) * 100))}%` : "50%";

  return (
    <Box
      role="img"
      aria-label={label}
      sx={{ position: "relative", height: 22, width: "100%" }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 9,
          height: 4,
          borderRadius: 1,
          bgcolor: "divider",
        }}
      />
      {average === undefined ? null : (
        <Box
          data-testid="range-average"
          sx={{
            position: "absolute",
            left: at(average),
            top: 3,
            width: 2,
            height: 16,
            bgcolor: "text.secondary",
          }}
        />
      )}
      <Box
        data-testid="range-value"
        sx={{
          position: "absolute",
          left: at(value),
          top: 3,
          width: 11,
          height: 11,
          ml: "-5px",
          borderRadius: "50%",
          bgcolor: "success.main",
          border: 2,
          borderColor: "background.paper",
        }}
      />
    </Box>
  );
}

/**
 * What a total is made of, as one bar rather than a list of percentages.
 *
 * A part too small to see is still counted in the total the panel states; the
 * bar is a proportion at a glance, not the figures themselves.
 *
 * @param {object} props
 * @param {Array<{id: string, label: string, value: number, tone?: string}>} props.parts
 * @param {(part: object) => string} [props.describe] - Tooltip for a part
 */
export function ProportionBar({ parts = [], describe }) {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
  if (total <= 0) return null;

  return (
    <Box sx={{ display: "flex", height: 26, borderRadius: 1, overflow: "hidden" }}>
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <Tooltip key={part.id} title={describe ? describe(part) : part.label} arrow>
            <Box
              data-testid={`proportion-${part.id}`}
              sx={{
                width: `${(part.value / total) * 100}%`,
                bgcolor: figureToneColour(part.tone ?? FIGURE_TONE.PLAIN),
              }}
            />
          </Tooltip>
        ))}
    </Box>
  );
}
