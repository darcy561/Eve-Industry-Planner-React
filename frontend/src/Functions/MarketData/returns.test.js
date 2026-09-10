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

  it("gives both routes at equal weight rather than picking one", () => {
    expect(returns().routes).toHaveLength(2);
  });
});

describe("the three normalisations of the net return", () => {
  it("states it per unit produced", () => {
    expect(returns().perUnit).toBe(40);
  });

  it("states it as a margin on revenue", () => {
    expect(returns().margin).toBeCloseTo(0.4);
  });

  it("states it against what the build cost", () => {
    expect(returns().returnOnOutlay).toBeCloseTo(0.8);
  });

  it("has no margin to state without revenue", () => {
    // Unanswerable rather than infinite, and an infinity would colour every
    // figure beside it.
    expect(returns({ sellPrice: 0 }).margin).toBeNull();
  });

  it("has no return on outlay to state without an outlay", () => {
    expect(returns({ buildCost: 0 }).returnOnOutlay).toBeNull();
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
    const losing = returns({ sellPrice: 10 });

    expect(losing.net).toBeLessThan(0);
    expect(losing.margin).toBeLessThan(0);
  });
});
