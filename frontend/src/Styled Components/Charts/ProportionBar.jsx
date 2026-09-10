import { Box, Tooltip, Typography, useTheme } from "@mui/material";

import { resolveSeriesColour } from "./chartTheme";

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
 */
export function ProportionBar({
  parts = [],
  describe,
  showLegend = false,
  height = 26,
}) {
  const theme = useTheme();
  const present = parts.filter((part) => Number(part.value) > 0);
  const total = present.reduce((sum, part) => sum + Number(part.value), 0);

  if (total <= 0) return null;

  const colourOf = (part, index) => resolveSeriesColour(theme, part, index);

  return (
    <Box>
      <Box sx={{ display: "flex", height, borderRadius: 1, overflow: "hidden" }}>
        {present.map((part, index) => (
          <Tooltip
            key={part.id}
            title={describe ? describe(part) : part.label}
            arrow
          >
            <Box
              data-testid={`proportion-${part.id}`}
              sx={{
                width: `${(part.value / total) * 100}%`,
                bgcolor: colourOf(part, index),
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
