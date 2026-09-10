import { describe, expect, it } from "vitest";

import { MATERIAL_PLAN } from "./materialSourcingRow";
import { buildCostBreakdown } from "./costBreakdown";

const row = (overrides) => ({
  quantity: 100,
  buyPrice: 10,
  buildPrice: null,
  paidCost: 0,
  plan: MATERIAL_PLAN.BUY,
  ...overrides,
});

const lineValue = (band, id) =>
  band.lines.find((line) => line.id === id)?.value;

describe("what a build costs", () => {
  it("prices a bought material at the market", () => {
    const cost = buildCostBreakdown({ rows: [row()] });

    expect(lineValue(cost.toBuild, "bought")).toBe(1000);
  });

  it("prices a built material at what building it costs", () => {
    const cost = buildCostBreakdown({
      rows: [row({ plan: MATERIAL_PLAN.BUILD, buildPrice: 8 })],
    });

    expect(lineValue(cost.toBuild, "built")).toBe(800);
  });

  it("counts a built material once, not in both lines", () => {
    // A child's own unit cost replaces the market price rather than adding to
    // it, so a linked material contributes nothing to the market line.
    const cost = buildCostBreakdown({
      rows: [row({ plan: MATERIAL_PLAN.BUILD, buildPrice: 8 })],
    });

    expect(lineValue(cost.toBuild, "bought")).toBeUndefined();
    expect(cost.toBuild.total).toBe(800);
  });

  it("counts what was paid for a material already bought, not an estimate", () => {
    const cost = buildCostBreakdown({
      rows: [row({ plan: MATERIAL_PLAN.PAID, paidCost: 940, buyPrice: 10 })],
    });

    expect(lineValue(cost.toBuild, "paid")).toBe(940);
    expect(lineValue(cost.toBuild, "bought")).toBeUndefined();
  });

  it("adds the job's own install cost and its extras", () => {
    const cost = buildCostBreakdown({
      rows: [],
      installCost: 500,
      extras: 250,
    });

    expect(cost.toBuild.total).toBe(750);
  });
});

describe("what selling it costs", () => {
  it("is its own band, because it is only paid on listing", () => {
    const cost = buildCostBreakdown({
      rows: [row()],
      brokerFee: 300,
      salesTax: 700,
    });

    expect(cost.toSell.total).toBe(1000);
    expect(cost.toBuild.total).toBe(1000);
    expect(cost.total).toBe(2000);
  });

  it("is absent when nothing is being charged for it", () => {
    // Stage H has a job with parents never listing its output at all.
    const cost = buildCostBreakdown({ rows: [row()] });

    expect(cost.toSell.lines).toHaveLength(0);
    expect(cost.toSell.total).toBe(0);
  });
});

describe("the figures a panel leads with", () => {
  it("divides the whole cost by what the job makes", () => {
    const cost = buildCostBreakdown({
      rows: [row()],
      brokerFee: 500,
      quantityProduced: 10,
    });

    expect(cost.perUnit).toBe(150);
  });

  it("has no per-unit cost for a job that makes nothing", () => {
    const cost = buildCostBreakdown({ rows: [row()], quantityProduced: 0 });

    expect(cost.perUnit).toBe(0);
  });
});

describe("what a breakdown leaves out", () => {
  it("states only the parts that are actually there", () => {
    // Listing every part a build could have had, at zero, reads as a figure
    // rather than as an absence.
    const cost = buildCostBreakdown({ rows: [row()], installCost: 100 });

    expect(cost.toBuild.lines.map((line) => line.id)).toEqual([
      "bought",
      "install",
    ]);
  });

  it("costs nothing for a job with no materials at all", () => {
    const cost = buildCostBreakdown({ rows: [] });

    expect(cost.total).toBe(0);
    expect(cost.toBuild.lines).toHaveLength(0);
  });
});
