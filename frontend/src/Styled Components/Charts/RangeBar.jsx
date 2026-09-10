import { Box, Typography, useTheme } from "@mui/material";

import { resolveSeriesColour } from "./chartTheme";

/**
 * Where one figure sits between a low and a high.
 *
 * States a position and nothing about whether that position is good. Wherever a
 * range is drawn from a player's own history, the history itself is the
 * benchmark — and a run of builds made in a poor market would make a bad
 * benchmark read as a good one.
 *
 * @param {object} props
 * @param {number} props.low
 * @param {number} props.high
 * @param {number} props.value - The figure being placed
 * @param {number} [props.average] - Marked separately where there is one
 * @param {{role?: string, colour?: string}} [props.marker] - How the figure is
 *   marked; takes the same shape a chart series does
 * @param {[React.ReactNode, React.ReactNode]} [props.labels] - What the ends are
 * @param {string} props.label - Describes the bar to a reader who cannot see it
 * @param {React.ReactNode} [props.empty] - Shown instead when there is no range
 */
export function RangeBar({
  low,
  high,
  value,
  average,
  marker,
  labels,
  label,
  empty = null,
}) {
  const theme = useTheme();

  if (![low, high, value].every(Number.isFinite)) return empty;

  const span = high - low;
  const at = (figure) =>
    span > 0
      ? `${Math.min(100, Math.max(0, ((figure - low) / span) * 100))}%`
      : "50%";

  return (
    <Box sx={{ width: "100%" }}>
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
        {Number.isFinite(average) ? (
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
        ) : null}
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
            bgcolor: resolveSeriesColour(theme, marker, 2),
            border: 2,
            borderColor: "background.paper",
          }}
        />
      </Box>
      {labels ? (
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          {labels.map((end, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              {end}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
