import { describe, it, expect } from "vitest";
import { createTheme } from "@mui/material/styles";
import {
  chartBaseColours,
  chartMargins,
  resolveSeriesColour,
  chartSeriesColours,
  sectorHighlight,
  withSeriesColours,
  zeroSplitOffset,
} from "./chartTheme";

const theme = createTheme();

describe("resolveSeriesColour", () => {
  // An explicit colour is the caller's, so a series that must match something
  // elsewhere on the page is not overridden by the palette.
  it("honours an explicit series colour", () => {
    expect(resolveSeriesColour(theme, { colour: "#abcdef" }, 3)).toBe(
      "#abcdef",
    );
  });

  // Charts assign colours by position, so the same series index is the same
  // colour on every chart of a page.
  it("assigns palette colours by index", () => {
    const palette = chartSeriesColours(theme);
    expect(resolveSeriesColour(theme, {}, 0)).toBe(palette[0]);
    expect(resolveSeriesColour(theme, {}, 1)).toBe(palette[1]);
  });

  // More series than colours must still render rather than returning undefined.
  it("wraps rather than running out", () => {
    const palette = chartSeriesColours(theme);
    expect(resolveSeriesColour(theme, {}, palette.length)).toBe(palette[0]);
  });

  // Each theme colour lends its light and dark as well as its main, so a chart
  // with more series than there are theme colours reaches for a variant of one
  // it has used rather than repeating a colour exactly.
  it("carries a light and a dark of every colour it starts from", () => {
    const palette = chartSeriesColours(theme);
    const base = chartBaseColours(theme);

    expect(palette).toHaveLength(base.length * 3);
    expect(new Set(palette).size).toBe(palette.length);
  });

  // A chart of six series or fewer looks as it always did.
  it("hands out every full-strength colour before any variant", () => {
    const palette = chartSeriesColours(theme);

    expect(palette.slice(0, chartBaseColours(theme).length)).toEqual(
      chartBaseColours(theme),
    );
  });

  it("keeps the six a caller picks from when a colour has to mean something", () => {
    expect(chartBaseColours(theme)).toEqual([
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.error.main,
    ]);
  });
});

describe("chartMargins", () => {
  // Long category labels need room beneath the axis. Value axes size themselves.
  it("widens the bottom margin for longer categories", () => {
    const short = chartMargins([{ month: "07" }], "month");
    const long = chartMargins([{ month: "September 2026 (partial)" }], "month");
    expect(long.bottom).toBeGreaterThan(short.bottom);
  });

  // Capped so one outlier label cannot squeeze out the plot area.
  it("caps the bottom margin", () => {
    const huge = chartMargins([{ month: "x".repeat(400) }], "month");
    expect(huge.bottom).toBeLessThanOrEqual(110);
  });

  // The axis draws the formatted label, so an ISO date that renders as a longer
  // human date needs the room its rendered form takes.
  it("measures the formatted label, not the raw value", () => {
    const raw = chartMargins([{ d: "2026-07-01" }], "d");
    const formatted = chartMargins([{ d: "2026-07-01" }], "d", {
      formatCategory: () => "01 September 2026",
    });
    expect(formatted.bottom).toBeGreaterThan(raw.bottom);
  });

  // Rotated labels occupy vertical space proportional to their length.
  it("gives rotated labels more room", () => {
    const flat = chartMargins([{ d: "2026-07-01" }], "d");
    const rotated = chartMargins([{ d: "2026-07-01" }], "d", { angle: -20 });
    expect(rotated.bottom).toBeGreaterThan(flat.bottom);
  });

  // No rows still yields usable margins rather than NaN.
  it("handles empty rows", () => {
    const margins = chartMargins([], "month");
    expect(Number.isFinite(margins.left)).toBe(true);
    expect(Number.isFinite(margins.bottom)).toBe(true);
  });
});

describe("withSeriesColours", () => {
  // Recharts reads a legend swatch from the entry's own fill. Colouring marks
  // only in a shape renderer draws the chart correctly and legends it grey, so
  // the colour has to reach the data.
  it("puts a colour on every row", () => {
    const rows = withSeriesColours(theme, [{ name: "A" }, { name: "B" }]);

    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.fill).toBeTruthy();
    }
  });

  it("gives neighbouring rows different colours", () => {
    const rows = withSeriesColours(theme, [
      { name: "A" },
      { name: "B" },
      { name: "C" },
    ]);

    expect(new Set(rows.map((row) => row.fill)).size).toBe(3);
  });

  it("keeps the row's own fields, and its own colour when it has one", () => {
    const rows = withSeriesColours(theme, [
      { name: "A", value: 5, colour: "#123456" },
    ]);

    expect(rows[0]).toMatchObject({ name: "A", value: 5, fill: "#123456" });
  });

  it("survives no rows", () => {
    expect(withSeriesColours(theme)).toEqual([]);
    expect(withSeriesColours(theme, [])).toEqual([]);
  });
});

describe("sectorHighlight", () => {
  const sector = {
    name: "Hauling Service",
    index: 1,
    outerRadius: 100,
    isActive: false,
  };

  // Nothing is hovered, so every slice draws at full strength.
  it("leaves the chart alone when nothing is hovered", () => {
    expect(sectorHighlight(sector, null)).toMatchObject({
      active: false,
      fillOpacity: 1,
      outerRadius: 100,
    });
  });

  it("grows the slice whose legend key is hovered", () => {
    const { active, fillOpacity, outerRadius } = sectorHighlight(
      sector,
      "Hauling Service",
    );

    expect(active).toBe(true);
    expect(fillOpacity).toBe(1);
    expect(outerRadius).toBeGreaterThan(100);
  });

  // The point of the highlight is contrast, so the others have to recede.
  it("fades the slices that are not hovered", () => {
    expect(sectorHighlight(sector, "Blueprint Copies")).toMatchObject({
      active: false,
      fillOpacity: 0.35,
      outerRadius: 100,
    });
  });

  // The legend sorts its own items, so its index is a position in the key list
  // rather than in the data. Matching on position highlights the wrong slice.
  it("matches on name rather than position", () => {
    const first = { name: "Other", index: 0, outerRadius: 100 };
    const second = { name: "Hauling Service", index: 1, outerRadius: 100 };

    expect(sectorHighlight(first, "Hauling Service").active).toBe(false);
    expect(sectorHighlight(second, "Hauling Service").active).toBe(true);
  });

  // Pointing at the slice itself reads the same as pointing at its key.
  it("honours the chart's own hover state", () => {
    expect(sectorHighlight({ ...sector, isActive: true }, null)).toMatchObject({
      active: true,
      fillOpacity: 1,
    });
  });

  // A percentage radius is resolved by the chart before the shape sees it, but a
  // non-numeric one must pass through rather than becoming NaN.
  it("passes a non-numeric radius through untouched", () => {
    expect(
      sectorHighlight({ name: "A", outerRadius: "75%" }, "A").outerRadius,
    ).toBe("75%");
  });
});

// The rotation is only as good as what the app's own theme yields. Its secondary
// is a grey chosen per mode rather than a hue, and several entries are left for
// MUI to derive, so the variants are worth checking against the real palettes
// rather than against a default theme.
describe("the palette the app's own themes yield", () => {
  const dark = createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#1565c0" },
      secondary: { main: "#eeeeee", dark: "#212121" },
    },
  });
  const light = createTheme({
    palette: {
      mode: "light",
      primary: { main: "#1e88e5" },
      secondary: { light: "#e0e0e0", main: "#757575" },
    },
  });

  it.each([
    ["dark", dark],
    ["light", light],
  ])("gives every series a colour in the %s theme", (_name, theme) => {
    const palette = chartSeriesColours(theme);

    expect(palette).toHaveLength(18);
    for (const colour of palette) {
      expect(typeof colour).toBe("string");
      expect(colour).toMatch(/^(#|rgb)/);
    }
  });

  it.each([
    ["dark", dark],
    ["light", light],
  ])("repeats no colour in the %s theme", (_name, theme) => {
    const palette = chartSeriesColours(theme);

    expect(new Set(palette).size).toBe(palette.length);
  });
});

// Every chart drawn from one palette in one order comes out looking like the
// last one. Each starts at its own place in the rotation instead — derived from
// the chart rather than drawn at random, because a random offset would pick a
// new one on every render and a series would change colour while a reader
// watched it.
describe("where a chart starts in the rotation", () => {
  const theme = createTheme();

  it("gives two charts of different things different colours", () => {
    expect(resolveSeriesColour(theme, {}, 0, "cost:month")).not.toBe(
      resolveSeriesColour(theme, {}, 0, "items:count"),
    );
  });

  it("gives the same chart the same colours every time", () => {
    expect(resolveSeriesColour(theme, {}, 1, "cost:month")).toBe(
      resolveSeriesColour(theme, {}, 1, "cost:month"),
    );
  });

  it("keeps a chart's own series distinct from each other", () => {
    const drawn = [0, 1, 2, 3].map((i) =>
      resolveSeriesColour(theme, {}, i, "cost:month"),
    );

    expect(new Set(drawn).size).toBe(drawn.length);
  });

  // A role says what a series means, and meaning does not move.
  it("leaves a series that means something where it is", () => {
    expect(resolveSeriesColour(theme, { role: "profit" }, 0, "a")).toBe(
      resolveSeriesColour(theme, { role: "profit" }, 0, "b"),
    );
  });

  it("leaves a colour a caller supplied alone", () => {
    expect(resolveSeriesColour(theme, { colour: "#abcdef" }, 0, "a")).toBe(
      "#abcdef",
    );
  });

  it("starts at the top of the rotation for a chart with no seed", () => {
    expect(resolveSeriesColour(theme, {}, 0)).toBe(
      chartSeriesColours(theme)[0],
    );
  });
});

// The app's own colours are in the rotation, so it has to hold them.
describe("the colours the app adds of its own", () => {
  it("draws them once they carry a light and a dark", () => {
    const base = createTheme({ palette: { mode: "dark" } });
    const theme = createTheme({
      palette: {
        mode: "dark",
        manufacturing: base.palette.augmentColor({
          color: { main: "#43a047" },
          name: "manufacturing",
        }),
      },
    });

    const palette = chartSeriesColours(theme);

    expect(palette).toContain("#43a047");
    expect(palette).toContain(theme.palette.manufacturing.light);
    expect(palette).toContain(theme.palette.manufacturing.dark);
  });

  // A palette entry the theme does not carry must not put a hole in the
  // rotation, or every series after it shifts.
  it("skips an entry the theme does not carry", () => {
    const palette = chartSeriesColours(createTheme());

    expect(palette.every(Boolean)).toBe(true);
  });
});

// A panel whose series are built from its data — one per extras category present
// in the window — changes that set as a reader changes the range. Seeding on the
// series would recolour every one of them at that moment, which is the thing the
// seed exists to avoid.
describe("a chart whose series come from its data", () => {
  const theme = createTheme();

  it("keeps a series' colour when the set of series changes", () => {
    const before = resolveSeriesColour(theme, {}, 0, "month");
    const after = resolveSeriesColour(theme, {}, 0, "month");

    expect(after).toBe(before);
  });

  // Seeding on what the series happen to be would have done this.
  it("would have moved it had the seed followed the data", () => {
    expect(resolveSeriesColour(theme, {}, 0, "hauling,copies")).not.toBe(
      resolveSeriesColour(theme, {}, 0, "hauling,copies,collateral"),
    );
  });
});

// The stop a gain/loss gradient splits at. It has to sit on the axis' zero line,
// so a run that never went negative must not be handed a break at all.
describe("the zero split of an area series", () => {
  const rows = [{ total: 300 }, { total: -100 }];

  it("puts the break where zero falls in the span", () => {
    expect(zeroSplitOffset(rows, "total")).toBeCloseTo(0.75);
  });

  it("draws a series that never lost entirely in the gain colour", () => {
    expect(zeroSplitOffset([{ total: 5 }, { total: 9 }], "total")).toBe(1);
  });

  it("draws a series that never gained entirely in the loss colour", () => {
    expect(zeroSplitOffset([{ total: -5 }, { total: -9 }], "total")).toBe(0);
  });

  // A pinned axis need not match the data's own span, and the colour break
  // follows the axis the reader is looking at.
  it("follows a pinned domain rather than the rows", () => {
    expect(zeroSplitOffset(rows, "total", [-300, 300])).toBeCloseTo(0.5);
  });

  it("survives a series with nothing in it", () => {
    expect(zeroSplitOffset([], "total")).toBe(0);
  });
});
