import { describe, expect, it } from "vitest";

import {
  COVERAGE_MODE,
  childJobCoverage,
  coverageModeFor,
  shortfallWording,
} from "./childJobCoverage";

const child = (jobID, produced, unitCost) => ({ jobID, produced, unitCost });

describe("what a material's child jobs actually cover", () => {
  it("costs a requirement the jobs meet exactly", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 100, 5)],
    });

    expect(coverage.covered).toBe(100);
    expect(coverage.shortfall).toBe(0);
    expect(coverage.isShort).toBe(false);
    expect(coverage.total).toBe(500);
    expect(coverage.assumed).toBe(false);
  });

  // Two jobs each producing half the requirement were each costed for all of it,
  // so a material built by siblings cost twice what it should.
  it("allocates the requirement across siblings rather than to each of them", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 50, 5), child("b", 50, 5)],
    });

    expect(coverage.covered).toBe(100);
    expect(coverage.total).toBe(500);
  });

  it("gives the same answer whichever order the siblings arrive in", () => {
    const forwards = childJobCoverage({
      required: 100,
      contributors: [child("a", 60, 4), child("b", 60, 9)],
    });
    const backwards = childJobCoverage({
      required: 100,
      contributors: [child("b", 60, 9), child("a", 60, 4)],
    });

    expect(forwards.total).toBe(backwards.total);
  });

  it("counts what siblings make beyond the requirement as surplus, not cost", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 80, 5), child("b", 80, 5)],
    });

    expect(coverage.produced).toBe(160);
    expect(coverage.covered).toBe(100);
    expect(coverage.surplus).toBe(60);
    expect(coverage.total).toBe(500);
  });
});

describe("a child job that no longer covers the requirement", () => {
  const short = [child("a", 50, 10)];

  it("buys the shortfall when nothing is going to resize the job", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: short,
      buyPrice: 12,
      mode: COVERAGE_MODE.SPLIT,
    });

    expect(coverage.buildCost).toBe(500);
    expect(coverage.buyCost).toBe(600);
    expect(coverage.total).toBe(1_100);
    expect(coverage.assumed).toBe(false);
    expect(coverage.unitCost).toBe(11);
  });

  it("extrapolates at the job's own rate when it is going to be resized", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: short,
      buyPrice: 12,
      mode: COVERAGE_MODE.EXTRAPOLATE,
    });

    expect(coverage.total).toBe(1_000);
    expect(coverage.buyCost).toBe(0);
    expect(coverage.assumed).toBe(true);
  });

  // Splitting is what the player asked for, but a material with no market price
  // has nothing to split against. Stating no cost for the shortfall would read as
  // the missing units being free.
  it("extrapolates and says so when the shortfall cannot be priced", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: short,
      buyPrice: null,
      mode: COVERAGE_MODE.SPLIT,
    });

    expect(coverage.total).toBe(1_000);
    expect(coverage.assumed).toBe(true);
    expect(coverage.mode).toBe(COVERAGE_MODE.EXTRAPOLATE);
  });

  it("still prices a requirement its jobs cover none of", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 0, 7)],
    });

    expect(coverage.covered).toBe(0);
    expect(coverage.total).toBe(700);
    expect(coverage.assumed).toBe(true);
  });

  it("has no per-unit cost for a requirement of nothing", () => {
    const coverage = childJobCoverage({ required: 0, contributors: short });

    expect(coverage.unitCost).toBeNull();
  });
});

describe("which way a shortfall is costed", () => {
  it("resizes a job that has not been committed yet", () => {
    expect(
      coverageModeFor({ isCommitted: false, automaticRecalculation: false }),
    ).toBe(COVERAGE_MODE.RESIZE);
  });

  it("extrapolates for a committed job the account will resize on close", () => {
    expect(
      coverageModeFor({ isCommitted: true, automaticRecalculation: true }),
    ).toBe(COVERAGE_MODE.EXTRAPOLATE);
  });

  it("splits for a committed job nothing is going to resize", () => {
    expect(
      coverageModeFor({ isCommitted: true, automaticRecalculation: false }),
    ).toBe(COVERAGE_MODE.SPLIT);
  });
});

// Committing an uncommitted job resizes it to the requirement, so the figure is
// what committing would cost rather than a claim about the job as it stands.
// Warning about a shortfall that confirming removes would be noise.
describe("a job that is resized when it is committed", () => {
  const coverage = childJobCoverage({
    required: 100,
    contributors: [child("a", 40, 7)],
    buyPrice: 12,
    mode: COVERAGE_MODE.RESIZE,
  });

  it("costs the whole requirement at the job's rate", () => {
    expect(coverage.total).toBe(700);
  });

  it("reports no shortfall to warn about", () => {
    expect(coverage.isShort).toBe(false);
    expect(coverage.assumed).toBe(false);
  });

  it("still says what the job makes today", () => {
    expect(coverage.produced).toBe(40);
    expect(coverage.shortfall).toBe(60);
  });
});

// The row's tag and the drawer's warning both say what happened to the units the
// child jobs do not make. Said in one place so they cannot come to disagree.
describe("how a shortfall is described", () => {
  const q = (value) => String(value);

  it("names the market where the shortfall is bought", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 40, 7)],
      buyPrice: 10,
      mode: COVERAGE_MODE.SPLIT,
    });

    expect(shortfallWording(coverage, q)).toContain("at the market price");
    expect(shortfallWording(coverage, q)).toContain("60 missing");
  });

  it("gives the total too where there is room for it", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 40, 7)],
      buyPrice: 10,
      mode: COVERAGE_MODE.SPLIT,
    });

    expect(shortfallWording(coverage, q, (v) => `${v} ISK`)).toContain(
      "600 ISK in total",
    );
  });

  it("says the rest is assumed where nothing buys it", () => {
    const coverage = childJobCoverage({
      required: 100,
      contributors: [child("a", 40, 7)],
      mode: COVERAGE_MODE.EXTRAPOLATE,
    });

    expect(shortfallWording(coverage, q)).toContain("assumption it is resized");
  });
});
