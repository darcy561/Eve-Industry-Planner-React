import { describe, expect, it } from "vitest";

import { jobTypes } from "../../Context/defaultValues";
import { getJobTypeAccentColour } from "./jobTypeDividerColour";

const theme = {
  palette: {
    manufacturing: { main: "#0f0" },
    reaction: { main: "#a0f" },
    pi: { main: "#0af" },
    baseMat: { main: "#888" },
    warning: { main: "#fa0" },
    primary: { main: "#00f" },
  },
};

describe("the accent colour for a job type", () => {
  it("gives each industry its own colour", () => {
    expect(getJobTypeAccentColour(theme, jobTypes.manufacturing)).toBe("#0f0");
    expect(getJobTypeAccentColour(theme, jobTypes.reaction)).toBe("#a0f");
    expect(getJobTypeAccentColour(theme, jobTypes.pi)).toBe("#0af");
    expect(getJobTypeAccentColour(theme, jobTypes.baseMaterial)).toBe("#888");
  });

  it("falls back for a job type it has no colour for", () => {
    expect(getJobTypeAccentColour(theme, 999)).toBe("#00f");
  });

  it("falls back rather than throwing on a theme without the industry colours", () => {
    // They are the app theme's own additions, and an accent is decoration —
    // losing one should not take down what it was decorating.
    const bare = { palette: { primary: { main: "#00f" } } };

    expect(getJobTypeAccentColour(bare, jobTypes.manufacturing)).toBe("#00f");
  });

  it("gives something usable even with no theme at all", () => {
    expect(getJobTypeAccentColour(undefined, jobTypes.reaction)).toBe(
      "currentColor",
    );
  });
});
