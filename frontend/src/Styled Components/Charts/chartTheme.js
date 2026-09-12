import { alpha } from "@mui/material/styles";
import { appShellInsetSurfaceSx } from "../../Context/appShell";
import {
  formatNumberForLocale,
  numberToShortText,
} from "../../Functions/Helper/numberParser";

/**
 * Shared chart styling and formatting, so every chart on a page agrees without
 * each one re-deriving it.
 */

/** The theme entries a chart draws series from, in assignment order. */
const SERIES_PALETTES = [
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
  "error",
  "manufacturing",
  "reaction",
  "pi",
  "baseMat",
  "groupJob",
  "blueprintOriginal",
  "blueprintCopy",
];

/** The six a caller picks from when a colour has to carry a meaning. */
const BASE_PALETTES = SERIES_PALETTES.slice(0, 6);

/**
 * Where in the rotation a chart starts.
 *
 * Charts drawn from one palette in one order all come out looking the same, so
 * each starts at its own place in it. Derived from the chart rather than drawn
 * at random: a random offset would pick a new one on every render, so a series
 * would change colour while a reader watched it, and the same chart would look
 * different on a reload. Seeded on what the chart *is* rather than on the rows
 * it holds, so adding data does not recolour it.
 *
 * @param {string} [seed]
 * @returns {number}
 */
export function paletteOffset(seed) {
  const text = String(seed ?? "");
  let hash = 0;

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

/**
 * The six theme colours a chart assigns from, at full strength.
 *
 * Where a caller needs colours that mean something rather than colours that are
 * merely distinct — a band of a total, say — this is the set to choose from.
 *
 * @param {object} theme
 * @returns {string[]}
 */
export function chartBaseColours(theme) {
  return BASE_PALETTES.map((name) => theme.palette[name].main);
}

/**
 * Series colours in assignment order.
 *
 * Each theme colour contributes its main, its light and its dark, and the whole
 * rotation is taken a shade at a time: every main before any light, every light
 * before any dark. A chart with six series or fewer therefore looks as it always
 * did, and a longer one reaches for a variant of a colour it has already used
 * rather than wrapping back onto an exact repeat.
 *
 * @param {object} theme
 * @returns {string[]}
 */
export function chartSeriesColours(theme) {
  return ["main", "light", "dark"].flatMap((shade) =>
    SERIES_PALETTES.map((name) => theme.palette[name]?.[shade]).filter(Boolean),
  );
}

/**
 * Colours for series that mean the same thing wherever they are drawn, so cost
 * reads as cost on every chart rather than taking whatever position it happens
 * to hold in the rotation.
 */
export function chartRoleColours(theme) {
  return {
    cost: theme.palette.warning.main,
    sales: theme.palette.info.main,
    profit: theme.palette.success.main,
    loss: theme.palette.error.main,
  };
}

/**
 * Resolves a series colour: an explicit one wins, then a named role, then the
 * rotation for series that carry no meaning beyond being distinct.
 */
export function resolveSeriesColour(theme, series, index, seed) {
  if (series?.colour) return series.colour;
  if (series?.role) {
    const byRole = chartRoleColours(theme)[series.role];
    if (byRole) return byRole;
  }
  const palette = chartSeriesColours(theme);

  // A named role is answered above, so only series that mean nothing beyond
  // being distinct are moved along the rotation.
  return palette[(index + paletteOffset(seed)) % palette.length];
}

/**
 * Stamps each row with the colour its mark is drawn in. Recharts takes a legend
 * swatch from the entry's own `fill`, so colouring marks only in a shape renderer
 * draws correctly and legends grey.
 */
export function withSeriesColours(theme, rows = [], seed) {
  return rows.map((row, index) => ({
    ...row,
    fill: resolveSeriesColour(theme, row, index, seed),
  }));
}

/**
 * How a sector should be drawn given what the pointer is over.
 *
 * Matched by name, not position: `Legend` sorts its own items (`itemSorter`
 * defaults to `"value"`) while sectors keep data order, so the index a legend
 * event reports points at the wrong slice. `isActive` is the chart's own hover
 * state, so a mark and its key read the same.
 *
 * @param {{isActive?: boolean, name?: string, outerRadius?: number}} sector
 * @param {string|null} hoveredName - legend item under the pointer, or null
 */
export function sectorHighlight(sector, hoveredName) {
  const hovering = hoveredName !== null && hoveredName !== undefined;
  const active =
    Boolean(sector?.isActive) || (hovering && sector?.name === hoveredName);
  const dimmed = hovering && !active;
  const outerRadius = Number(sector?.outerRadius);
  return {
    active,
    fillOpacity: dimmed ? 0.35 : 1,
    outerRadius:
      active && Number.isFinite(outerRadius)
        ? outerRadius * HIGHLIGHT_GROWTH
        : sector?.outerRadius,
  };
}

/** How much a highlighted sector grows. Enough to read, not enough to reflow. */
const HIGHLIGHT_GROWTH = 1.06;

/** Axis ticks use short text; long ISK values would otherwise clip. */
export function formatAxisValue(value) {
  return numberToShortText(value);
}

/** Tooltips show the full figure. */
export function formatTooltipValue(value) {
  return formatNumberForLocale(value);
}

export function chartTooltipProps(theme) {
  const surface = appShellInsetSurfaceSx(theme);
  return {
    allowEscapeViewBox: { x: false, y: false },
    wrapperStyle: {
      maxWidth: "min(420px, calc(100vw - 48px))",
      zIndex: 2,
    },
    contentStyle: {
      backgroundColor: surface.backgroundColor,
      border: surface.border,
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius * 2,
      padding: "10px",
      maxWidth: "min(420px, calc(100vw - 48px))",
      whiteSpace: "normal",
      wordBreak: "break-word",
      backdropFilter: "blur(3px)",
    },
    itemStyle: { color: theme.palette.text.primary },
    cursor: { fill: alpha(theme.palette.primary.main, 0.08) },
  };
}

export function chartAxisProps(theme) {
  return {
    stroke: alpha(theme.palette.primary.main, 0.35),
    tick: { fill: theme.palette.text.secondary, fontSize: 12 },
    tickLine: { stroke: alpha(theme.palette.primary.main, 0.35) },
  };
}

/** Grid lines, kept faint so they sit behind the marks rather than beside them. */
export function chartGridStroke(theme) {
  return alpha(theme.palette.primary.main, 0.12);
}

/**
 * Bottom margin sized to the longest drawn category label. The value axes size
 * themselves with width="auto"; rotated labels need more room than flat ones.
 */
export function chartMargins(
  rows,
  categoryKey,
  { formatCategory, angle } = {},
) {
  const longest = (rows ?? []).reduce((widest, row) => {
    const raw = row?.[categoryKey];
    const text = String(formatCategory ? formatCategory(raw) : (raw ?? ""));
    return text.length > widest ? text.length : widest;
  }, 0);
  // A rotated label occupies vertical space proportional to its length; a flat
  // one only needs room for a single line.
  const perChar = angle ? 5 : 2;
  return {
    top: 12,
    right: 16,
    bottom: Math.min(110, 24 + longest * perChar),
    left: 8,
  };
}

/** Legend type, matched to the panel's secondary text. */
export function chartLegendProps(theme) {
  return {
    wrapperStyle: {
      fontSize: 12,
      color: theme.palette.text.secondary,
    },
  };
}

/**
 * The box a category chart draws into: full width, at a fixed aspect within a
 * bounded height.
 *
 * Exported so a caller reserving space for a chart that has not loaded yet
 * occupies exactly the height the chart will take, rather than restating these
 * and drifting from them.
 *
 * @param {boolean} deviceNotMobile
 */
export function timeSeriesSurfaceStyle(deviceNotMobile) {
  return {
    width: "100%",
    aspectRatio: deviceNotMobile ? 1.9 : 1.2,
    minHeight: 220,
    maxHeight: 320,
  };
}

/**
 * Where zero sits in a series' vertical span, as a 0–1 fraction from the top —
 * the stop a two-colour gradient splits at so the part of an area above the
 * axis draws in one colour and the part below it in another.
 *
 * Taken from the drawn axis rather than from the rows when a domain is pinned,
 * because the colour break has to land on the axis' zero line and a pinned
 * domain need not match the data's own span.
 *
 * @param {Array<Object>} rows
 * @param {string} key
 * @param {[number, number]} [domain]
 * @returns {number}
 */
export function zeroSplitOffset(rows, key, domain) {
  const values = (rows ?? [])
    .map((row) => Number(row?.[key]))
    .filter((value) => Number.isFinite(value));
  const [low, high] = Array.isArray(domain) ? domain.map(Number) : [];
  const min = Number.isFinite(low) ? low : Math.min(0, ...values);
  const max = Number.isFinite(high) ? high : Math.max(0, ...values);

  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return 0;
  if (min >= 0) return 1;
  return max / (max - min);
}
