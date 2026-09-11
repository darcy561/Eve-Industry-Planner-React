import { Box, Tooltip, Typography, useTheme } from "@mui/material";

import { resolveSeriesColour } from "../chartTheme";

/**
 * What a total is made of, as one bar.
 *
 * Carries no figures of its own: a part too small to see is still counted in the
 * total, and the total belongs to whatever is stating it.
 *
 * Parts take the same shape a chart series does, so a part that means the same
 * thing here and in a chart is the same colour in both.
 *
 * @param {object} props
 * @param {Array<{id: string, label: React.ReactNode, value: number, role?: string, colour?: string}>} props.parts
 * @param {(part: object) => React.ReactNode} [props.describe] - What a part's tooltip says
 * @param {boolean} [props.showLegend]
 * @param {number} [props.height]
 * @param {string|null} [props.activeId] - The part being looked at, dimming the
 *   rest so the eye can carry it to whatever states the same part in words
 * @param {(id: string|null) => void} [props.onActivePart] - Supplied by a
 *   consumer that has somewhere to carry it to; without it the bar is inert
 */
export function ProportionBar({
  parts = [],
  describe,
  showLegend = false,
  height = 26,
  activeId = null,
  onActivePart,
}) {
  const theme = useTheme();
  const present = parts.filter((part) => Number(part.value) > 0);
  const total = present.reduce((sum, part) => sum + Number(part.value), 0);

  if (total <= 0) return null;

  const colourOf = (part, index) => resolveSeriesColour(theme, part, index);

  // Only a bar with somewhere to send the answer takes focus: a bar nothing
  // listens to would add a tab stop per segment and do nothing with it.
  const interactive = Boolean(onActivePart);
  const activate = (id) => () => onActivePart?.(id);

  return (
    <Box>
      <Box
        sx={{ display: "flex", height, borderRadius: 1, overflow: "hidden" }}
      >
        {present.map((part, index) => (
          <Tooltip
            key={part.id}
            title={describe ? describe(part) : part.label}
            arrow
          >
            <Box
              data-testid={`proportion-${part.id}`}
              data-active={activeId === part.id ? "true" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onMouseEnter={activate(part.id)}
              onMouseLeave={activate(null)}
              onFocus={activate(part.id)}
              onBlur={activate(null)}
              sx={{
                width: `${(part.value / total) * 100}%`,
                bgcolor: colourOf(part, index),
                cursor: interactive ? "default" : undefined,
                // The others recede rather than this one brightening: a segment
                // drawn in a colour that means something must keep it.
                opacity: activeId && activeId !== part.id ? 0.35 : 1,
                transition: theme.transitions.create("opacity", {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            />
          </Tooltip>
        ))}
      </Box>
      {showLegend ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
          {present.map((part, index) => (
            <Box
              key={part.id}
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}
            >
              <Box
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "2px",
                  bgcolor: colourOf(part, index),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {part.label}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
