import { describe, expect, it } from "vitest";

import { MATERIAL_PLAN } from "./materialSourcingRow";
import { buildCostBreakdown } from "./costBreakdown";

/** A row as useMaterialsSourcing builds one: what is left to source is on it. */
const row = ({ quantity = 100, paidQuantity = 0, ...overrides } = {}) => ({
  quantity,
  remainingQuantity: quantity - paidQuantity,
  buyPrice: 10,
  buildPrice: null,
  paidCost: 0,
  plan: MATERIAL_PLAN.BUY,
  ...overrides,
});

const lineValue = (band, id) =>
  band.lines.find((line) => line.id === id)?.value;

const lineDetail = (band, id) =>
  band.lines.find((line) => line.id === id)?.detail;

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
      rows: [
        row({
          plan: MATERIAL_PLAN.PAID,
          paidQuantity: 100,
          paidCost: 940,
          buyPrice: 10,
        }),
      ],
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

  it("has no per-unit cost to state for a job that makes nothing", () => {
    // Unanswerable rather than zero, the same as every other ratio here.
    const cost = buildCostBreakdown({ rows: [row()], quantityProduced: 0 });

    expect(cost.perUnit).toBeNull();
  });
});

describe("what a breakdown leaves out", () => {
  it("states only the parts that are actually there", () => {
    // Listing every part a build could have had, at zero, reads as a figure
    // rather than as an absence.
    const cost = buildCostBreakdown({ rows: [row()], installCost: 100 });

    expect(cost.toBuild.lines.map((line) => line.id)).not.toContain("built");
    expect(cost.toBuild.lines.map((line) => line.id)).not.toContain("paid");
  });

  // The one exception, and it is deliberate: a build with no extras recorded is
  // the common case, so the row is the only thing telling a reader the stage
  // takes them at all.
  it("keeps the extras row even at zero, as an invitation", () => {
    const cost = buildCostBreakdown({ rows: [row()], installCost: 100 });
    const extras = cost.toBuild.lines.find((line) => line.id === "extras");

    expect(extras.value).toBe(0);
    expect(extras.detail).toMatch(/Hauling/);
  });

  it("drops the invitation once there is a figure to state instead", () => {
    const cost = buildCostBreakdown({ rows: [row()], extras: 500 });
    const extras = cost.toBuild.lines.find((line) => line.id === "extras");

    expect(extras.value).toBe(500);
    expect(extras.detail).toBeUndefined();
  });

  it("costs nothing for a job with no materials at all", () => {
    const cost = buildCostBreakdown({ rows: [] });

    expect(cost.total).toBe(0);
    expect(cost.toBuild.lines.map((line) => line.id)).toEqual(["extras"]);
  });
});

describe("what each line says about itself", () => {
  it("says how much of the list the market line covers", () => {
    const cost = buildCostBreakdown({
      rows: [row(), row(), row({ plan: MATERIAL_PLAN.BUILD, buildPrice: 8 })],
    });

    expect(lineDetail(cost.toBuild, "bought")).toBe(
      "2 of 3 · 1 replaced by child builds"
    );
  });

  it("does not mention child builds where there are none", () => {
    const cost = buildCostBreakdown({ rows: [row(), row()] });

    expect(lineDetail(cost.toBuild, "bought")).toBe("2 of 2");
  });

  it("carries the rates behind the selling figures", () => {
    const cost = buildCostBreakdown({
      rows: [row()],
      brokerFee: 100,
      salesTax: 200,
      sellDetail: {
        brokerFee: "1.5% at Jita · Broker Relations IV",
        salesTax: "2.25% of revenue · Accounting IV",
      },
    });

    expect(lineDetail(cost.toSell, "brokerFee")).toBe(
      "1.5% at Jita · Broker Relations IV"
    );
    expect(lineDetail(cost.toSell, "salesTax")).toContain("Accounting IV");
  });
});

describe("a material bought in part", () => {
  const partly = () =>
    row({
      quantity: 1000,
      paidQuantity: 400,
      paidCost: 4_000_000,
      buyPrice: 5_000,
      plan: MATERIAL_PLAN.BUY,
    });

  it("counts what was already spent on it", () => {
    const cost = buildCostBreakdown({ rows: [partly()] });

    expect(lineValue(cost.toBuild, "paid")).toBe(4_000_000);
  });

  it("estimates only the units still to buy", () => {
    // Pricing all 1000 would charge for 400 nobody is going to buy again.
    const cost = buildCostBreakdown({ rows: [partly()] });

    expect(lineValue(cost.toBuild, "bought")).toBe(3_000_000);
  });

  it("comes to what was spent plus what is left to spend", () => {
    expect(buildCostBreakdown({ rows: [partly()] }).total).toBe(7_000_000);
  });

  it("charges nothing more for a material bought in full", () => {
    const cost = buildCostBreakdown({
      rows: [
        row({ quantity: 1000, paidQuantity: 1000, paidCost: 9_000, plan: MATERIAL_PLAN.PAID }),
      ],
    });

    expect(cost.total).toBe(9_000);
  });
});

describe("per unit", () => {
  it("is worked out once, for every line and every total", () => {
    // Two divisions of the same figures is how two totals that disagree start.
    const cost = buildCostBreakdown({
      rows: [row()],
      installCost: 500,
      quantityProduced: 10,
    });

    expect(cost.toBuild.lines[0].perUnit).toBe(100);
    expect(cost.toBuild.perUnit).toBe(150);
    expect(cost.perUnit).toBe(cost.total / 10);
  });
});

// The toggle changes what the components are, not merely how they are labelled:
// the materials line grows and the child-builds line disappears.
describe("pricing every material at market", () => {
  const linked = () =>
    row({ plan: MATERIAL_PLAN.BUILD, buildPrice: 4, buyPrice: 10, quantity: 100 });

  it("prices a linked row at market and drops the child-builds line", () => {
    const cost = buildCostBreakdown({ rows: [linked()], buyEverything: true });

    expect(cost.toBuild.lines.map((line) => line.id)).not.toContain("built");
    const bought = cost.toBuild.lines.find((line) => line.id === "bought");
    expect(bought.value).toBe(1000);
  });

  it("prices it from the child build when left alone", () => {
    const cost = buildCostBreakdown({ rows: [linked()] });

    const built = cost.toBuild.lines.find((line) => line.id === "built");
    expect(built.value).toBe(400);
  });

  // A purchase already made is a record rather than an estimate, so no model
  // reprices it.
  it("leaves what was actually paid alone in either model", () => {
    const paid = row({
      plan: MATERIAL_PLAN.PAID,
      paidCost: 700,
      remainingQuantity: 0,
      quantity: 100,
    });

    for (const buyEverything of [false, true]) {
      const cost = buildCostBreakdown({ rows: [paid], buyEverything });
      expect(
        cost.toBuild.lines.find((line) => line.id === "paid").value,
      ).toBe(700);
    }
  });
});
