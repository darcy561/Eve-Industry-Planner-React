import { describe, expect, it } from "vitest";
import { createTheme } from "@mui/material/styles";

import { costPartColour } from "./costParts";
import { chartSeriesColours } from "../../../../../../Styled Components/Charts/chartTheme";


// The bands have to stay tellable apart: the rotation alone would eventually
// hand a selling charge the same colour as a material.
describe("which colour each part is drawn in", () => {
  const theme = createTheme();

  // Every id the breakdown can emit, not a sample: one left out of the order
  // takes whatever the rotation hands an unknown part, which is how `paid` came
  // to be drawn in the same colour as `bought`.
  const BUILD_IDS = [
    "bought",
    "built",
    "paid",
    "install",
    "invention",
    "extras",
  ];

  it("gives every build part a colour of its own", () => {
    const build = BUILD_IDS.map((id) => costPartColour(theme, id));

    expect(new Set(build).size).toBe(build.length);
  });

  // Both are bins of the same band and a build can carry both: materials bought
  // at market, and materials already paid for out of stock.
  it("draws materials already paid for apart from materials bought", () => {
    expect(costPartColour(theme, "paid")).not.toBe(
      costPartColour(theme, "bought"),
    );
  });

  it("keeps the selling charges apart from every build part", () => {
    const build = BUILD_IDS.map((id) => costPartColour(theme, id));

    for (const id of ["brokerFee", "salesTax"]) {
      expect(build).not.toContain(costPartColour(theme, id));
    }
  });

  it("draws the two selling charges apart from each other", () => {
    expect(costPartColour(theme, "brokerFee")).not.toBe(
      costPartColour(theme, "salesTax"),
    );
  });

  it("takes its colours from the shared chart palette", () => {
    expect(chartSeriesColours(theme)).toContain(costPartColour(theme, "bought"));
  });
});

// How many extras categories a build has is up to the player, so their colours
// cannot come from a list of any fixed length. They are shades of the one extras
// colour: derived, so there is a shade for however many there turn out to be.
describe("splitting the extras by category", () => {
  const theme = createTheme();
  const ids = (n) => Array.from({ length: n }, (_, i) => `extras:${i}`);

  it("gives every category a colour of its own", () => {
    const drawn = ids(5).map((id) => costPartColour(theme, id, ids(5)));

    expect(new Set(drawn).size).toBe(5);
  });

  it("still tells them apart when there are more than the palette holds", () => {
    const many = ids(12);
    const drawn = many.map((id) => costPartColour(theme, id, many));

    expect(new Set(drawn).size).toBe(many.length);
  });

  it("keeps every shade clear of the other components", () => {
    const many = ids(8);
    const shades = many.map((id) => costPartColour(theme, id, many));
    const others = ["bought", "built", "paid", "install", "invention"].map((id) =>
      costPartColour(theme, id),
    );

    for (const other of others) {
      expect(shades).not.toContain(other);
    }
  });

  it("gives a lone category the extras colour itself", () => {
    expect(costPartColour(theme, "extras:1", ["extras:1"])).toBe(
      costPartColour(theme, "extras"),
    );
  });

  it("reads the same for the same category however often it is asked", () => {
    const many = ids(4);

    expect(costPartColour(theme, "extras:2", many)).toBe(
      costPartColour(theme, "extras:2", many),
    );
  });
});
