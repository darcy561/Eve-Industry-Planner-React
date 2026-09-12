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
  // an account written before the split arrives with the key present and each
  // side empty, not with the key missing. Taking that as an answer would
  // overwrite a real default.
  //
  // Both empty shapes are covered: PricingSide's fields are omitempty, so Go
  // sends `{}`, and a document written by anything else may still carry the
  // empty strings.
  it.each([
    ["omitted by Go", {}],
    ["written out in full", { market: "", basis: "" }],
  ])("seeds from the single default when a side arrives %s", (_name, side) => {
    const merged = merge({
      defaultMarketLocation: "amarr",
      defaultOrderType: "buy",
      defaultPricing: { buying: { ...side }, selling: { ...side } },
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

  // What is persisted is the merged copy, so a side's group defaults have to
  // survive a merge that is not about them.
  it("keeps a side's market group defaults when the server sends them", () => {
    const groups = { 1857: { market: "hek" } };

    const merged = merge({
      defaultPricing: {
        buying: { market: "jita", basis: "sell", groups },
        selling: { market: "amarr", basis: "buy" },
      },
    });

    expect(merged.defaultPricing.buying.groups).toEqual(groups);
    expect(merged.defaultPricing.selling.groups).toBeUndefined();
  });

  it("keeps groups already held when the server sends a side without them", () => {
    const groups = { 1857: { market: "hek" } };
    const prev = {
      ...stateDefault(),
      defaultPricing: {
        buying: { market: "jita", basis: "sell", groups },
        selling: { market: "jita", basis: "sell" },
      },
    };

    const merged = merge({ defaultMarketLocation: "amarr" }, prev);

    expect(merged.defaultPricing.buying.groups).toEqual(groups);
  });

  // A side the upgrader has not filled can still carry groups: losing them
  // because the market is empty is the bug this guards.
  it("keeps groups on a side that names no market of its own", () => {
    const groups = { 1857: { market: "hek" } };

    const merged = merge({
      defaultMarketLocation: "amarr",
      defaultOrderType: "buy",
      defaultPricing: { buying: { groups }, selling: {} },
    });

    expect(merged.defaultPricing.buying).toEqual({
      market: "amarr",
      basis: "buy",
      groups,
    });
  });
});
