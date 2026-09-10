import { Box, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { resolveSeriesColour } from "../chartTheme";

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
 * @param {React.ReactNode} [props.middleLabel] - What the span between them is
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
  middleLabel,
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
        {/* The span the ends describe, drawn over the track: without it the two
            end labels are just numbers, and the bar states no range at all. */}
        <Box
          data-testid="range-span"
          sx={{
            position: "absolute",
            left: at(low),
            right: 0,
            top: 9,
            height: 4,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.35),
          }}
        />
        {[low, high].map((end, index) => (
          <Box
            key={index}
            data-testid="range-tick"
            sx={{
              position: "absolute",
              left: at(end),
              top: 4,
              width: "1px",
              height: 14,
              bgcolor: "text.secondary",
              opacity: 0.55,
            }}
          />
        ))}
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
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {labels[0]}
          </Typography>
          {middleLabel ? (
            <Typography variant="caption" color="text.secondary">
              {middleLabel}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            {labels[1]}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
