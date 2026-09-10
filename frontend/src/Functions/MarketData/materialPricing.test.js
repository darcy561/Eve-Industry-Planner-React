import { describe, expect, it } from "vitest";

import JobMaterial from "../../Classes/jobMaterial";
import {
  materialCostByBasis,
  materialPurchaseState,
  summariseBasisUse,
  priceAge,
} from "./materialPricing";

// Prices differ per basis so a total can only come out right if the basis reached
// the lookup; the hub is included so an override on the hub is visible too.
const PRICES = {
  34: { jita: { buy: 5, sell: 10, buyP95: 6, sellP05: 9 } },
  35: { jita: { buy: 50, sell: 100, buyP95: 60, sellP05: 90 } },
  36: { amarr: { buy: 500, sell: 1000, buyP95: 600, sellP05: 900 } },
};

const getPrice = (typeID, hub, basis) => PRICES[typeID]?.[hub]?.[basis] ?? 0;

const materials = [
  { typeID: 34, quantity: 10 },
  { typeID: 35, quantity: 2 },
];

function basisById(options) {
  return Object.fromEntries(options.map((o) => [o.id, o]));
}

describe("materialCostByBasis", () => {
  it("costs the job on every basis the app offers", () => {
    const options = materialCostByBasis({
      materials,
      layout: {},
      marketSelect: "jita",
      listingSelect: "sell",
      getPrice,
    });

    const byId = basisById(options);
    expect(byId.buy.total).toBe(10 * 5 + 2 * 50);
    expect(byId.sell.total).toBe(10 * 10 + 2 * 100);
    expect(byId.buyP95.total).toBe(10 * 6 + 2 * 60);
    expect(byId.sellP05.total).toBe(10 * 9 + 2 * 90);
  });

  it("marks the basis in effect and measures the others against it", () => {
    const byId = basisById(
      materialCostByBasis({
        materials,
        layout: {},
        marketSelect: "jita",
        listingSelect: "sell",
        getPrice,
      })
    );

    expect(byId.sell.isCurrent).toBe(true);
    expect(byId.sell.delta).toBe(0);
    // Buying rather than selling is 150 cheaper on these materials.
    expect(byId.buy.delta).toBe(-150);
    expect(byId.buyP95.isCurrent).toBe(false);
  });

  it("keeps a row's own basis override on every candidate", () => {
    const layout = {
      materialPriceOverrides: { 34: { orderDisplay: "buy" } },
    };

    const byId = basisById(
      materialCostByBasis({
        materials,
        layout,
        marketSelect: "jita",
        listingSelect: "sell",
        getPrice,
      })
    );

    // The overridden row stays on buy (5) whichever basis is being costed, so
    // only the un-overridden row moves between them.
    expect(byId.sell.total).toBe(10 * 5 + 2 * 100);
    expect(byId.buyP95.total).toBe(10 * 5 + 2 * 60);
  });

  it("keeps a row's own hub override too", () => {
    const layout = {
      materialPriceOverrides: { 36: { marketDisplay: "amarr" } },
    };

    const byId = basisById(
      materialCostByBasis({
        materials: [{ typeID: 36, quantity: 1 }],
        layout,
        marketSelect: "jita",
        listingSelect: "sell",
        getPrice,
      })
    );

    expect(byId.sell.total).toBe(1000);
  });

  it("costs a job with no materials at zero on every basis", () => {
    const options = materialCostByBasis({
      materials: [],
      layout: {},
      marketSelect: "jita",
      listingSelect: "sell",
      getPrice,
    });

    expect(options).toHaveLength(4);
    expect(options.every((o) => o.total === 0 && o.delta === 0)).toBe(true);
  });

  it("treats a price the market has no figure for as zero rather than failing", () => {
    const byId = basisById(
      materialCostByBasis({
        materials: [{ typeID: 999, quantity: 5 }],
        layout: {},
        marketSelect: "jita",
        listingSelect: "sell",
        getPrice,
      })
    );

    expect(byId.sell.total).toBe(0);
  });
});

describe("materialPurchaseState", () => {
  // The requirement comes from the setups on a real job, so it is passed as the
  // constructor's second argument rather than set on the row.
  const materialBought = (required, purchases) =>
    new JobMaterial(
      { typeID: 34, name: "Tritanium", purchasing: purchases },
      required
    );

  it("reports a fully bought material as paid, at what it cost", () => {
    const material = materialBought(100, [
      { id: "p1", itemCount: 100, itemCost: 7 },
    ]);

    expect(materialPurchaseState(material)).toMatchObject({
      kind: "paid",
      paidQuantity: 100,
      paidCost: 700,
      remainingQuantity: 0,
    });
  });

  it("reports a partly bought material as both paid and outstanding", () => {
    const material = materialBought(100, [
      { id: "p1", itemCount: 40, itemCost: 7 },
    ]);

    expect(materialPurchaseState(material)).toMatchObject({
      kind: "part-paid",
      paidQuantity: 40,
      paidCost: 280,
      remainingQuantity: 60,
    });
  });

  it("reports an unbought material as an estimate", () => {
    const material = materialBought(100, []);

    expect(materialPurchaseState(material)).toMatchObject({
      kind: "estimated",
      paidQuantity: 0,
      paidCost: 0,
      remainingQuantity: 100,
    });
  });

  it("does not count buying more than the job needs as extra cost", () => {
    const material = materialBought(100, [
      { id: "p1", itemCount: 250, itemCost: 7 },
    ]);
    const state = materialPurchaseState(material);

    expect(state.kind).toBe("paid");
    expect(state.paidQuantity).toBe(100);
    expect(state.paidCost).toBe(700);
  });
});

// A material the setups ask for none of: purchaseComplete is false by definition
// (it requires quantity > 0), and nothing bought against it counts, so the row is
// an estimate of nothing rather than paid.
describe("a material the job needs none of", () => {
  it("is an estimate with nothing outstanding and nothing counted", () => {
    const material = new JobMaterial(
      {
        typeID: 34,
        name: "Tritanium",
        purchasing: [{ id: "p1", itemCount: 50, itemCost: 7 }],
      },
      0
    );

    expect(materialPurchaseState(material)).toMatchObject({
      kind: "estimated",
      paidQuantity: 0,
      paidCost: 0,
      remainingQuantity: 0,
    });
  });
});

describe("summariseBasisUse", () => {
  const row = (overrides) => ({
    marketSelect: "jita",
    listingSelect: "sell",
    plan: "buy",
    ...overrides,
  });

  it("counts a row priced against another hub", () => {
    const rows = [row(), row({ marketSelect: "amarr" })];

    expect(summariseBasisUse(rows, "jita", "sell").overridden).toBe(1);
  });

  it("counts a row priced on another basis", () => {
    const rows = [row(), row({ listingSelect: "buyP95" })];

    expect(summariseBasisUse(rows, "jita", "sell").overridden).toBe(1);
  });

  it("counts a row departing on both as one row, not two", () => {
    const rows = [row({ marketSelect: "amarr", listingSelect: "buy" })];

    expect(summariseBasisUse(rows, "jita", "sell").overridden).toBe(1);
  });

  it("counts rows that are not estimates at all", () => {
    const rows = [row(), row({ plan: "paid" }), row({ plan: "paid" })];

    expect(summariseBasisUse(rows, "jita", "sell").purchased).toBe(2);
  });

  it("counts nothing when every row is on the basis", () => {
    expect(summariseBasisUse([row(), row()], "jita", "sell")).toMatchObject({
      overridden: 0,
      purchased: 0,
    });
  });

  it("copes with no rows", () => {
    expect(summariseBasisUse(undefined, "jita", "sell").overridden).toBe(0);
  });
});

// The server refreshes on a period measured in hours, and a stale figure looks
// exactly as authoritative as a fresh one.
describe("priceAge", () => {
  const now = Date.now();
  const found = (byType) => (typeID) => byType[typeID];

  it("reports the age of the stalest price behind the total", () => {
    const age = priceAge(
      [{ typeID: 34 }, { typeID: 35 }],
      found({
        34: { lastUpdated: now - 60_000 },
        35: { lastUpdated: now - 600_000 },
      }),
    );

    expect(age).toBeGreaterThanOrEqual(600_000);
    expect(age).toBeLessThan(700_000);
  });

  it("passes over a material whose price carries no timestamp", () => {
    const age = priceAge(
      [{ typeID: 34 }, { typeID: 35 }],
      found({ 34: { lastUpdated: now - 60_000 }, 35: {} }),
    );

    expect(age).toBeLessThan(70_000);
  });

  it("has no age to state when nothing is priced", () => {
    expect(priceAge([{ typeID: 34 }], found({}))).toBeNull();
    expect(priceAge([], found({}))).toBeNull();
  });
});
