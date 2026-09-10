import { useCallback, useMemo, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  Sector,
  Tooltip,
} from "recharts";
import {
  chartLegendProps,
  chartTooltipProps,
  formatTooltipValue,
  sectorHighlight,
  withSeriesColours,
} from "../chartTheme";

/**
 * Share of a total across a small set of slices.
 *
 * @param {Object} props
 * @param {Array<Object>} props.rows
 * @param {string} props.categoryKey
 * @param {string} props.valueKey
 * @param {(value: any) => string} [props.formatValue]
 * @param {Object} [props.style] - CSS sizing overrides
 */
export function PieChart({
  rows = [],
  categoryKey,
  valueKey,
  formatValue = formatTooltipValue,
  style,
  width,
  height,
  paletteSeed,
}) {
  const theme = useTheme();
  const deviceNotMobile = useMediaQuery(theme.breakpoints.up("sm"));

  // Seeded on the fields the chart draws rather than on the rows themselves, so
  // two charts of different things differ and adding a row recolours nothing.
  const seed = paletteSeed ?? `${categoryKey}:${valueKey}`;
  const colouredRows = useMemo(
    () => withSeriesColours(theme, rows, seed),
    [rows, theme, seed],
  );

  // Matched on name: the legend sorts its own keys, so the index it reports is
  // not the sector's.
  const [hoveredName, setHoveredName] = useState(null);
  const highlight = useCallback((payload) => setHoveredName(payload?.value ?? null), []);
  const clearHighlight = useCallback(() => setHoveredName(null), []);

  const renderSector = useCallback(
    (props) => {
      const { fillOpacity, outerRadius } = sectorHighlight(props, hoveredName);
      return (
        <Sector
          {...props}
          outerRadius={outerRadius}
          fillOpacity={fillOpacity}
          stroke={theme.palette.background.default}
        />
      );
    },
    [hoveredName, theme],
  );

  return (
    <RechartsPieChart
      responsive
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
      style={{
        width: "100%",
        aspectRatio: deviceNotMobile ? 1.4 : 1,
        minHeight: 220,
        maxHeight: 320,
        ...style,
      }}
    >
      <Pie
        data={colouredRows}
        dataKey={valueKey}
        nameKey={categoryKey}
        innerRadius="45%"
        outerRadius="75%"
        paddingAngle={2}
        shape={renderSector}
      />
      <Tooltip
        {...chartTooltipProps(theme)}
        formatter={(value, name) => [formatValue(value), name]}
      />
      <Legend
        position="bottom"
        {...chartLegendProps(theme)}
        onMouseEnter={highlight}
        onMouseLeave={clearHighlight}
      />
    </RechartsPieChart>
  );
}

export default PieChart;
