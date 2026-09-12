import { describe, expect, test } from "vitest";

import {
  SALE_LOCATION_KIND,
  getDefaultSaleStructure,
  getSaleStructures,
  resolveSaleLocation,
} from "./saleLocations";

// Every assertion reads its subject back through the accessors rather than
// naming a placeholder, so these tests hold unchanged once the stored lane
// replaces them.

/** The two rows, as "the default" and "one that is not the default". */
function structurePair() {
  const structures = getSaleStructures();
  const fallback = getDefaultSaleStructure();
  return {
    fallback,
    other: structures.find((i) => i.id !== fallback.id),
  };
}

describe("saved sale structures", () => {
  test("a default is available without one being chosen", () => {
    expect(getDefaultSaleStructure()).not.toBeNull();
  });

  test("every row carries what pricing a sale from it needs", () => {
    for (const structure of getSaleStructures()) {
      expect(typeof structure.id).toBe("string");
      expect(typeof structure.structureID).toBe("number");
      expect(typeof structure.brokerFee).toBe("number");
      expect(typeof structure.priceHub).toBe("string");
    }
  });

  test("exactly one row is the default", () => {
    expect(getSaleStructures().filter((i) => i.default)).toHaveLength(1);
  });

  test("more than one structure is available to choose between", () => {
    expect(getSaleStructures().length).toBeGreaterThan(1);
  });
});

describe("resolveSaleLocation", () => {
  test("a structure supplies its own broker fee", () => {
    const structure = getDefaultSaleStructure();
    const location = resolveSaleLocation(structure.id);

    expect(location.kind).toBe(SALE_LOCATION_KIND.STRUCTURE);
    expect(location.brokerFee).toBe(structure.brokerFee);
  });

  test("a structure prices against a hub rather than itself", () => {
    const structure = getDefaultSaleStructure();
    const location = resolveSaleLocation(structure.id);
    const hub = resolveSaleLocation(null, structure.priceHub);

    expect(location.priceHubID).toBe(hub.priceHubID);
  });

  test("choosing a structure resolves that one, not the default", () => {
    const { fallback, other } = structurePair();
    const location = resolveSaleLocation(other.id);

    expect(location.id).toBe(other.id);
    expect(location.brokerFee).toBe(other.brokerFee);
    expect(location.brokerFee).not.toBe(fallback.brokerFee);
  });

  test("two structures on different hubs price against different stations", () => {
    const { fallback, other } = structurePair();

    expect(other.priceHub).not.toBe(fallback.priceHub);
    expect(resolveSaleLocation(other.id).priceHubID).not.toBe(
      resolveSaleLocation(fallback.id).priceHubID,
    );
  });

  test("a hub carries no broker fee, because the rate comes from the seller", () => {
    const location = resolveSaleLocation(null, "jita");

    expect(location.kind).toBe(SALE_LOCATION_KIND.HUB);
    expect(location.brokerFee).toBeNull();
  });

  test("an unknown structure id falls back to a hub rather than returning nothing", () => {
    const location = resolveSaleLocation("no-such-structure", "amarr");

    expect(location.kind).toBe(SALE_LOCATION_KIND.HUB);
    expect(location.id).toBe("amarr");
  });

  test("naming neither still resolves, so a caller always has a location", () => {
    expect(resolveSaleLocation()).not.toBeNull();
  });
});
