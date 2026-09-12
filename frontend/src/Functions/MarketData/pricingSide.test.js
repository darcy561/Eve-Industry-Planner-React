import { describe, expect, it } from "vitest";
import {
  PRICING_SIDE,
  resolvePricingSide,
  setJobPricingSide,
} from "./pricingSide.js";

const account = {
  buying: { market: "jita", basis: "sell" },
  selling: { market: "amarr", basis: "buy" },
};

const resolve = (jobPricing, side = PRICING_SIDE.BUYING) =>
  resolvePricingSide({ jobPricing, accountPricing: account, side });

describe("resolvePricingSide", () => {
  it("answers each side from its own account default", () => {
    expect(resolve(null, PRICING_SIDE.BUYING)).toEqual({
      marketDisplay: "jita",
      orderDisplay: "sell",
    });
    expect(resolve(null, PRICING_SIDE.SELLING)).toEqual({
      marketDisplay: "amarr",
      orderDisplay: "buy",
    });
  });

  it("lets the job outrank the account, per side", () => {
    const job = { selling: { market: "hek", basis: "buyP95" } };

    expect(resolve(job, PRICING_SIDE.SELLING)).toEqual({
      marketDisplay: "hek",
      orderDisplay: "buyP95",
    });
    expect(resolve(job, PRICING_SIDE.BUYING)).toEqual({
      marketDisplay: "jita",
      orderDisplay: "sell",
    });
  });

  // A job naming a market but no basis has not chosen a basis, so the rung below
  // still answers it. Resolving the pair together would silently take both.
  it("resolves market and basis independently", () => {
    expect(resolve({ buying: { market: "dodixie" } })).toEqual({
      marketDisplay: "dodixie",
      orderDisplay: "sell",
    });
    expect(resolve({ buying: { basis: "buy" } })).toEqual({
      marketDisplay: "jita",
      orderDisplay: "buy",
    });
  });

  it("treats an empty value as no choice at any rung", () => {
    expect(resolve({ buying: { market: "", basis: "" } })).toEqual({
      marketDisplay: "jita",
      orderDisplay: "sell",
    });
    expect(
      resolvePricingSide({
        jobPricing: null,
        accountPricing: { buying: { market: "", basis: "" } },
        side: PRICING_SIDE.BUYING,
      }),
    ).toEqual({ marketDisplay: "jita", orderDisplay: "sell" });
  });

  it("falls through to the global default when nothing has said", () => {
    expect(
      resolvePricingSide({
        jobPricing: null,
        accountPricing: null,
        side: PRICING_SIDE.SELLING,
      }),
    ).toEqual({ marketDisplay: "jita", orderDisplay: "sell" });
  });
});

describe("setJobPricingSide", () => {
  it("sets one field of one side and leaves the other alone", () => {
    const next = setJobPricingSide(
      { selling: { market: "hek", basis: "buy" } },
      PRICING_SIDE.BUYING,
      "market",
      "amarr",
    );

    expect(next.buying).toEqual({ market: "amarr", basis: null });
    expect(next.selling).toEqual({ market: "hek", basis: "buy" });
  });

  it("replaces a value rather than keeping the first one", () => {
    const first = setJobPricingSide(
      null,
      PRICING_SIDE.BUYING,
      "market",
      "amarr",
    );

    expect(
      setJobPricingSide(first, PRICING_SIDE.BUYING, "market", "dodixie").buying
        .market,
    ).toBe("dodixie");
  });

  it("answers null once nothing is chosen anywhere", () => {
    const one = setJobPricingSide(null, PRICING_SIDE.SELLING, "basis", "buy");

    expect(
      setJobPricingSide(one, PRICING_SIDE.SELLING, "basis", null),
    ).toBeNull();
  });

  it("reads an empty string as clearing the field", () => {
    const one = setJobPricingSide(null, PRICING_SIDE.BUYING, "market", "amarr");

    expect(
      setJobPricingSide(one, PRICING_SIDE.BUYING, "market", ""),
    ).toBeNull();
  });
});
