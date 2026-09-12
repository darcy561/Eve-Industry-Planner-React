import { useId } from "react";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  chartAxisProps,
  chartGridStroke,
  chartLegendProps,
  chartMargins,
  chartRoleColours,
  chartTooltipProps,
  formatAxisValue,
  formatTooltipValue,
  resolveSeriesColour,
  timeSeriesSurfaceStyle,
  zeroSplitOffset,
} from "../chartTheme";

/**
 * Draws rows against a category axis. Takes data and a series description, never
 * a query result, so the same component draws profit by month, cost by item, or
 * extras by category.
 *
 * @param {Object} props
 * @param {Array<Object>} props.rows
 * @param {string} props.categoryKey - row field for the category axis
 * @param {Array<{key: string, label: string, type?: 'bar'|'line'|'area', colour?: string, axis?: 'left'|'right', fillOpacity?: number, splitAtZero?: boolean, hidden?: boolean}>} props.series
 * @param {(value: any) => string} [props.formatCategory]
 * @param {(value: any) => string} [props.formatValue]
 * @param {(value: any) => string} [props.formatCategoryLabel] - tooltip heading
 * @param {(value: any) => string} [props.formatAxisTick] - axis ticks; defaults to short text
 * @param {string} [props.leftAxisLabel]
 * @param {[number, number]} [props.leftDomain] - defaults to recharts' own
 *   scaling; a pinned domain is held to exactly, not widened to fit the rows
 * @param {boolean} [props.showLegend] - on for a chart with more than one
 *   series; off for one whose keys are drawn beside it by [ChartKeys]
 * @param {[number, number]} [props.rightDomain]
 * @param {number} [props.categoryAngle] - rotate category labels when they are long
 * @param {boolean} [props.showGrid] - grid lines; on by default
 * @param {Object} [props.tooltipProps] - merged over the app-shell tooltip
 * @param {Object} [props.axisProps] - merged over the app-shell axis styling
 * @param {Object} [props.style] - CSS sizing; defaults to full width at a fixed
 *   aspect ratio, so the chart follows the width of the page it is on
 * @param {string} [props.rightAxisLabel]
 */
export function TimeSeriesChart({
  rows = [],
  categoryKey,
  series = [],
  formatCategory,
  formatValue = formatTooltipValue,
  formatCategoryLabel,
  formatAxisTick = formatAxisValue,
  leftAxisLabel,
  rightAxisLabel,
  leftDomain,
  rightDomain,
  categoryAngle,
  showGrid = true,
  /**
   * Where this chart starts in the colour rotation. Name one wherever two charts
   * share a category, and wherever the series are built from the data.
   */
  paletteSeed,
  showLegend = true,
  tooltipProps,
  axisProps: axisPropsOverride,
  style,
  width,
  height,
}) {
  const theme = useTheme();
  // Falls back to the category rather than to the series keys: a panel whose
  // series are built from its data — one per extras category present in the
  // window, say — would otherwise take a new seed whenever that set changed, and
  // every series on the chart would recolour as a reader changed the range.
  //
  // The cost of the fallback is that two charts over the same category start in
  // the same place; a panel that wants its own colours names a `paletteSeed`.
  const seed = paletteSeed ?? categoryKey;
  const deviceNotMobile = useMediaQuery(theme.breakpoints.up("sm"));
  const axisProps = { ...chartAxisProps(theme), ...axisPropsOverride };
  const hasRightAxis = series.some((s) => s.axis === "right");
  const gradientPrefix = useId();
  // An area that reports a gain or a loss is drawn in one colour either side of
  // the axis, which SVG can only express as a gradient the mark is filled with.
  // The id has to be unique per chart on the page, so two panels drawing the
  // same series do not share one another's split point.
  const splitSeries = series.filter(
    (s) => s.type === "area" && s.splitAtZero === true,
  );
  const splitGradientID = (key) => `${gradientPrefix}split-${key}`;
  const roleColours = chartRoleColours(theme);

  return (
    <ComposedChart
      responsive
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
      data={rows}
      margin={chartMargins(rows, categoryKey, {
        formatCategory,
        angle: categoryAngle,
      })}
      style={{
        ...timeSeriesSurfaceStyle(deviceNotMobile),
        ...style,
      }}
    >
      {splitSeries.length > 0 && (
        <defs>
          {splitSeries.map((s) => {
            const offset = zeroSplitOffset(
              rows,
              s.key,
              s.axis === "right" ? rightDomain : leftDomain,
            );
            return (
              <linearGradient
                key={s.key}
                id={splitGradientID(s.key)}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset={offset} stopColor={roleColours.profit} />
                <stop offset={offset} stopColor={roleColours.loss} />
              </linearGradient>
            );
          })}
        </defs>
      )}
      {showGrid && (
        <CartesianGrid stroke={chartGridStroke(theme)} vertical={false} />
      )}
      <XAxis
        dataKey={categoryKey}
        tickFormatter={formatCategory}
        interval="preserveStartEnd"
        {...(categoryAngle ? { angle: categoryAngle, textAnchor: "end" } : {})}
        {...axisProps}
      />
      <YAxis
        width="auto"
        tickFormatter={formatAxisTick}
        domain={leftDomain}
        allowDataOverflow={Boolean(leftDomain)}
        label={
          leftAxisLabel
            ? { value: leftAxisLabel, position: "top", offset: 15 }
            : undefined
        }
        {...axisProps}
      />
      {hasRightAxis && (
        <YAxis
          yAxisId="right"
          orientation="right"
          width="auto"
          tickFormatter={formatAxisTick}
          domain={rightDomain}
          allowDataOverflow={Boolean(rightDomain)}
          label={
            rightAxisLabel
              ? { value: rightAxisLabel, position: "top", offset: 12 }
              : undefined
          }
          {...axisProps}
        />
      )}
      <Tooltip
        {...chartTooltipProps(theme)}
        {...tooltipProps}
        // recharts keeps a hidden series' figures in the tooltip; a formatter
        // that answers nothing is how an entry is dropped from it.
        formatter={(value, name, entry) =>
          series.find((s) => s.key === entry?.dataKey)?.hidden
            ? null
            : [formatValue(value), name]
        }
        labelFormatter={formatCategoryLabel ?? formatCategory}
      />
      {showLegend && series.length > 1 && (
        <Legend position="top" {...chartLegendProps(theme)} />
      )}
      {series.map((s, index) => {
        const colour = resolveSeriesColour(theme, s, index, seed);
        const shared = {
          dataKey: s.key,
          name: s.label,
          // Declared and hidden rather than left out, so every series keeps its
          // place in the colour rotation while a reader sets some of them aside.
          hide: Boolean(s.hidden),
          ...(s.axis === "right" ? { yAxisId: "right" } : {}),
          // Stacked bars total to their height, which suits composition but not
          // comparison — so it is per series, not chart-wide.
          ...(s.stackId ? { stackId: s.stackId } : {}),
        };
        if (s.type === "line") {
          // A sparse series has categories with no reading at all — a month
          // nothing sold in has no average price, which is not zero. Gaps are
          // bridged so the trend reads, and the real readings are dotted so the
          // bridge is not mistaken for data. Without dots a reading with gaps
          // either side draws nothing at all.
          const sparse = s.sparse === true;
          return (
            <Line
              key={s.key}
              {...shared}
              type="monotone"
              stroke={colour}
              connectNulls={sparse}
              dot={sparse ? { r: 2.5, fill: colour, strokeWidth: 0 } : false}
              activeDot
            />
          );
        }
        if (s.type === "area") {
          // The same gradient serves both edges: `fillOpacity` applies to the
          // fill alone, so the outline stays solid while the body is washed out.
          const paint = s.splitAtZero
            ? `url(#${splitGradientID(s.key)})`
            : colour;
          return (
            <Area
              key={s.key}
              {...shared}
              type="monotone"
              stroke={paint}
              fill={paint}
              fillOpacity={s.fillOpacity ?? 0.2}
            />
          );
        }
        return (
          <Bar
            key={s.key}
            {...shared}
            fill={colour}
            fillOpacity={s.fillOpacity ?? 0.85}
          />
        );
      })}
    </ComposedChart>
  );
}

export default TimeSeriesChart;
