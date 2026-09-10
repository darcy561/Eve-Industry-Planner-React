import { describe, expect, it } from "vitest";

import { calculateReturns } from "./returns";

const returns = (overrides = {}) =>
  calculateReturns({
    sellPrice: 100,
    buyPrice: 80,
    quantityProduced: 10,
    buildCost: 500,
    brokerFee: 30,
    salesTax: 70,
    ...overrides,
  });

const route = (result, id) => result.routes.find((r) => r.id === id);

describe("the two ways out", () => {
  it("charges a listing both the broker fee and the tax", () => {
    // 1000 revenue − 30 fee − 70 tax − 500 build
    expect(route(returns(), "listed").net).toBe(400);
  });

  it("charges selling into buy orders the tax only", () => {
    // Nothing is listed, so no broker fee: 800 − 70 − 500
    expect(route(returns(), "immediate").net).toBe(230);
  });

  it("states each route's revenue before what selling costs", () => {
    expect(route(returns(), "listed").revenue).toBe(1000);
    expect(route(returns(), "immediate").revenue).toBe(800);
  });

  it("picks neither as the one to lead with", () => {
    // A player selling only into buy orders would otherwise be shown a margin
    // that is not theirs, with nothing saying whose it was.
    const result = returns();

    expect(result.routes).toHaveLength(2);
    expect(result.net).toBeUndefined();
    expect(result.margin).toBeUndefined();
    expect(result.perUnit).toBeUndefined();
    for (const r of result.routes) {
      expect(r).toHaveProperty("net");
      expect(r).toHaveProperty("margin");
      expect(r).toHaveProperty("returnOnOutlay");
    }
  });
});

describe("the three normalisations of the net return", () => {
  it("states each route per unit produced", () => {
    expect(route(returns(), "listed").perUnit).toBe(40);
    expect(route(returns(), "immediate").perUnit).toBe(23);
  });

  it("states each route as a margin on its own revenue", () => {
    expect(route(returns(), "listed").margin).toBeCloseTo(0.4);
    expect(route(returns(), "immediate").margin).toBeCloseTo(0.2875);
  });

  it("states each route against what the build cost", () => {
    expect(route(returns(), "listed").returnOnOutlay).toBeCloseTo(0.8);
    expect(route(returns(), "immediate").returnOnOutlay).toBeCloseTo(0.46);
  });

  it("has no margin to state without revenue", () => {
    // Unanswerable rather than infinite, and an infinity would colour every
    // figure beside it.
    expect(route(returns({ sellPrice: 0 }), "listed").margin).toBeNull();
  });

  it("has no return on outlay to state without an outlay", () => {
    expect(route(returns({ buildCost: 0 }), "listed").returnOnOutlay).toBeNull();
  });
});

describe("break-even", () => {
  it("is what a unit must fetch to cover the build and the selling", () => {
    // (500 + 30 + 70) / 10
    expect(returns().breakEvenPerUnit).toBe(60);
  });

  it("has nothing to state for a job that produces nothing", () => {
    expect(returns({ quantityProduced: 0 }).breakEvenPerUnit).toBeNull();
  });
});

describe("a build that loses money", () => {
  it("says so with a negative net rather than clamping at zero", () => {
    const losing = route(returns({ sellPrice: 10 }), "listed");

    expect(losing.net).toBeLessThan(0);
    expect(losing.margin).toBeLessThan(0);
  });
});
