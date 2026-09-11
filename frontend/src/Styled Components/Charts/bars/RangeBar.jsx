import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { resolveSeriesColour } from "../chartTheme";

/**
 * How each of the bar's two marks is drawn.
 *
 * Exported so a panel can put the same mark beside the figure it stands for: on
 * the bar they are a dot and an upright line with nothing to say which is which,
 * and a key drawn any other way is a second thing to keep in step.
 *
 * @param {"value"|"average"} mark
 * @returns {object} An `sx` object
 */
export function rangeMarkSx(mark) {
  if (mark === "average") {
    return { width: 2, height: 11, bgcolor: "text.secondary", flexShrink: 0 };
  }

  return {
    width: 9,
    height: 9,
    borderRadius: "50%",
    bgcolor: (theme) => resolveSeriesColour(theme, null, 2),
    flexShrink: 0,
  };
}

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
 * @param {[React.ReactNode, React.ReactNode]} [props.labels] - What the ends are.
 *   Each says what it is as well as what it reads, since two bare numbers under
 *   a line do not say which end is which
 * @param {string} props.label - What the picture means, for a reader who cannot
 *   see it and for one hovering it. Says what the bar is showing rather than
 *   restating its figures: they are already written beneath it, and a tooltip is
 *   a poor place to read a long number
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

  // The drawn scale is wider than the range it holds. Mapping the range onto the
  // whole track leaves the span covering everything and the end ticks on the
  // ends, so the range stops reading as a range — and a build cheaper or dearer
  // than every previous one clamps onto an end, where it is indistinguishable
  // from one that exactly matched it. Padding leaves somewhere for it to be.
  // Checked for being a number rather than for being given: the marker below is
  // drawn only for a finite average, and a scale built from one that is not
  // would put every position at NaN — including the ones that are fine.
  const marked = Number.isFinite(average);
  const from = Math.min(low, value, marked ? average : low);
  const to = Math.max(high, value, marked ? average : high);
  // A run of builds that all cost the same has no width to pad, and would divide
  // by nothing.
  const padding = (to - from) * 0.15 || 1;
  const scale = to - from + padding * 2;

  const at = (figure) => `${((figure - (from - padding)) / scale) * 100}%`;

  return (
    <Box sx={{ width: "100%" }}>
      <Tooltip title={label} arrow>
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
              width: `calc(${at(high)} - ${at(low)})`,
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
          {marked ? (
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
      </Tooltip>
      {labels ? (
        // Room beneath: the ends sit hard against whatever a panel puts under
        // them otherwise, and three lines of caption run together as one.
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            mt: 0.25,
            mb: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {labels[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {labels[1]}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
