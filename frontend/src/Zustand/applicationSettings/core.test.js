import { describe, expect, it } from "vitest";
import { mergeApplicationSettingsState, stateDefault } from "./core.js";

const merge = (incoming, prev = stateDefault()) =>
  mergeApplicationSettingsState(prev, incoming, null);

describe("pricing defaults", () => {
  it("starts both sides on the global default", () => {
    expect(stateDefault().defaultPricing).toEqual({
      buying: { market: "jita", basis: "sell" },
      selling: { market: "jita", basis: "sell" },
    });
  });

  it("seeds both sides from an account that only has the single default", () => {
    const merged = merge({
      defaultMarketLocation: "amarr",
      defaultOrderType: "buy",
    });

    expect(merged.defaultPricing).toEqual({
      buying: { market: "amarr", basis: "buy" },
      selling: { market: "amarr", basis: "buy" },
    });
  });

  it("keeps the sides apart once the server sends them", () => {
    const merged = merge({
      defaultMarketLocation: "amarr",
      defaultOrderType: "buy",
      defaultPricing: {
        buying: { market: "jita", basis: "sell" },
        selling: { market: "hek", basis: "buy" },
      },
    });

    expect(merged.defaultPricing.buying).toEqual({
      market: "jita",
      basis: "sell",
    });
    expect(merged.defaultPricing.selling).toEqual({
      market: "hek",
      basis: "buy",
    });
  });

  it("seeds only the side the server left out", () => {
    const merged = merge({
      defaultMarketLocation: "dodixie",
      defaultOrderType: "sellP05",
      defaultPricing: { selling: { market: "hek", basis: "buy" } },
    });

    expect(merged.defaultPricing.buying).toEqual({
      market: "dodixie",
      basis: "sellP05",
    });
    expect(merged.defaultPricing.selling).toEqual({
      market: "hek",
      basis: "buy",
    });
  });

  // Go serialises DefaultPricing whether or not the stored document holds it, so
  // an account written before the split arrives as empty strings rather than as
  // a missing key. Taking those as an answer would overwrite a real default.
  it("seeds from the single default when the wire carries empty sides", () => {
    const merged = merge({
      defaultMarketLocation: "amarr",
      defaultOrderType: "buy",
      defaultPricing: {
        buying: { market: "", basis: "" },
        selling: { market: "", basis: "" },
      },
    });

    expect(merged.defaultPricing).toEqual({
      buying: { market: "amarr", basis: "buy" },
      selling: { market: "amarr", basis: "buy" },
    });
  });

  it("falls back to the previous single default when neither is sent", () => {
    const prev = { ...stateDefault(), defaultMarketLocation: "hek" };
    delete prev.defaultPricing;

    expect(merge({ displayHelpCards: true }, prev).defaultPricing).toEqual({
      buying: { market: "hek", basis: "sell" },
      selling: { market: "hek", basis: "sell" },
    });
  });
});
