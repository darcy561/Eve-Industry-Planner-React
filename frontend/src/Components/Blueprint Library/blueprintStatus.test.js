import { describe, expect, it } from "vitest";
import { createTheme } from "@mui/material/styles";

import { blueprintAccentColour } from "./blueprintStatus";
import { jobTypes } from "../../Context/defaultValues";

const theme = createTheme({
  palette: {
    manufacturing: { main: "#1f6feb" },
    reaction: { main: "#a371f7" },
    warning: { main: "#d29922" },
    error: { main: "#f85149" },
  },
});

const colourOf = (...args) => blueprintAccentColour(...args)(theme);
const idleJob = null;
const runningJob = { runs: 1 };

describe("the colour a blueprint card is edged in", () => {
  it("takes the colour of the industry it is for", () => {
    expect(colourOf(idleJob, false, -1, jobTypes.manufacturing)).toBe("#1f6feb");
    expect(colourOf(idleJob, false, -1, jobTypes.reaction)).toBe("#a371f7");
  });

  // The artwork already says original or copy, so the edge only softens rather than changing hue.
  it("softens the same colour for a copy", () => {
    const original = colourOf(idleJob, false, -1, jobTypes.manufacturing);
    const copy = colourOf(idleJob, true, 10, jobTypes.manufacturing);

    expect(copy).not.toBe(original);
    expect(copy).toContain("0.55");
  });

  // A state the player can act on outranks saying what kind of job it would be.
  it("warns instead when a job is running on it", () => {
    expect(colourOf(runningJob, false, -1, jobTypes.manufacturing)).toBe(
      "#d29922"
    );
  });

  // The job will use up every run it has left, so it does not survive.
  it("marks a copy the running job will consume as expiring", () => {
    expect(colourOf(runningJob, true, 1, jobTypes.manufacturing)).toBe(
      "#f85149"
    );
  });

  it("leaves a copy with runs to spare merely in use", () => {
    expect(colourOf(runningJob, true, 50, jobTypes.manufacturing)).toBe(
      "#d29922"
    );
  });

  // An accent is decoration; losing one should not take down what it decorates.
  it("falls back when the theme names no colour for that industry", () => {
    expect(colourOf(idleJob, false, -1, undefined)).toBe(
      theme.palette.primary.main
    );
  });
});
