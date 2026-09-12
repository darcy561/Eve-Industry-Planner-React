import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { resolveSeriesColour } from "./chartTheme";

/**
 * A chart's keys as buttons, for a chart whose reader decides what it holds.
 *
 * Recharts draws its own legend into a layer the chart surface takes the click
 * from, so a key there reads as clickable and is not; these are ordinary
 * buttons above the chart, which also puts the keys on the tab order. A chart
 * drawn beside them turns its own legend off.
 *
 * Colours come from [resolveSeriesColour] with the chart's own seed, so a key
 * and the mark it names cannot disagree.
 *
 * @param {Object} props
 * @param {Array<{key: string, label: string, colour?: string, role?: string, hidden?: boolean}>} props.series
 * @param {string} [props.seed] - the chart's `paletteSeed`
 * @param {(key: string) => void} props.onToggle
 */
export function ChartKeys({ series = [], seed, onToggle }) {
  const theme = useTheme();
  const showing = series.filter((s) => !s.hidden).length;

  return (
    <Stack sx={{ alignItems: "center", gap: 0.5, mb: 1 }}>
      <Stack
        direction="row"
        sx={{ flexWrap: "wrap", justifyContent: "center", gap: 0.75 }}
      >
        {series.map((s, index) => {
          // A chart with nothing left on it says nothing about why, so the last
          // key standing cannot be pressed rather than quietly doing nothing.
          const onlyOneLeft = showing === 1 && !s.hidden;
          const colour = resolveSeriesColour(theme, s, index, seed);

          return (
            <Tooltip
              key={s.key}
              title={
                onlyOneLeft
                  ? "One has to stay on the chart"
                  : s.hidden
                    ? `Show ${s.label}`
                    : `Hide ${s.label}`
              }
            >
              {/* A disabled button fires no pointer events and leaves the tab
                  order, so the tooltip needs an element of its own to sit on —
                  and that element takes the focus, or the reason the last key
                  cannot be pressed would only ever reach a mouse. */}
              <Box
                component="span"
                tabIndex={onlyOneLeft ? 0 : undefined}
                sx={{ display: "inline-flex" }}
              >
                <Box
                  component="button"
                  type="button"
                  aria-pressed={!s.hidden}
                  disabled={onlyOneLeft}
                  onClick={() => onToggle(s.key)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    py: 0.25,
                    // A pressed key is filled in its own colour and an unpressed
                    // one is an empty outline: the difference has to read at a
                    // glance from across the panel, not only in the swatch.
                    border: `1px solid ${
                      s.hidden ? theme.palette.divider : alpha(colour, 0.5)
                    }`,
                    borderRadius: 4,
                    backgroundColor: s.hidden
                      ? "transparent"
                      : alpha(colour, 0.14),
                    font: "inherit",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: s.hidden ? "text.disabled" : "text.primary",
                    textDecoration: s.hidden ? "line-through" : "none",
                    cursor: onlyOneLeft ? "default" : "pointer",
                    transition: theme.transitions.create([
                      "background-color",
                      "border-color",
                      "opacity",
                    ]),
                    opacity: onlyOneLeft ? 0.7 : 1,
                    "&:hover": {
                      backgroundColor: onlyOneLeft
                        ? undefined
                        : alpha(colour, s.hidden ? 0.08 : 0.24),
                      borderColor: onlyOneLeft ? undefined : alpha(colour, 0.7),
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "2px",
                      // Hollow rather than grey, so a key that is off still says
                      // which colour it will come back as.
                      backgroundColor: s.hidden ? "transparent" : colour,
                      border: `1px solid ${alpha(colour, s.hidden ? 0.6 : 1)}`,
                    }}
                  />
                  {s.label}
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Press a key to take it off the chart
      </Typography>
    </Stack>
  );
}

export default ChartKeys;
