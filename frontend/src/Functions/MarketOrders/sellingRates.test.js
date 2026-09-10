import { describe, expect, it, vi } from "vitest";

const stationData = { race_id: 500001, owner: 1000035 };
const skills = { data: {} };
const standings = { data: [] };

let station = stationData;
vi.mock("../EveESI/World/getStationData", () => ({
  default: async () => station,
}));
vi.mock("../../Hooks/EveEsi/Character/useGetCharacterSkills", () => ({
  getCachedCharacterSkills: () => skills,
}));
vi.mock("../../Hooks/EveEsi/Character/useGetCharacterStandings", () => ({
  getCachedCharacterStandings: () => standings,
}));

const {
  brokerFeeAmount,
  brokerFeeRate,
  getSellerSkills,
  salesTaxAmount,
  salesTaxRate,
} = await import("./sellingRates.js");
const { SALE_LOCATION_KIND, resolveSaleLocation, getDefaultSaleStructure } =
  await import("./saleLocations.js");

const HASH = "hash-1";

function trained({ brokerRelations = 0, accounting = 0 } = {}) {
  skills.data = {
    3446: { activeLevel: brokerRelations },
    16622: { activeLevel: accounting },
  };
}

describe("broker fee rate", () => {
  it("is the base at a station for an untrained character with no standings", async () => {
    trained();
    standings.data = [];

    expect(await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH))
      .toBeCloseTo(3);
  });

  it("comes down with Broker Relations and both standings", async () => {
    trained({ brokerRelations: 5 });
    standings.data = [
      { from_id: stationData.race_id, standing: 5 },
      { from_id: stationData.owner, standing: 2.5 },
    ];

    // 3 − 0.3×5 − 0.03×5 − 0.02×2.5
    expect(await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH))
      .toBeCloseTo(1.3);
  });

  it("reaches the published 1% floor at maximum skill and standings", async () => {
    trained({ brokerRelations: 5 });
    standings.data = [
      { from_id: stationData.race_id, standing: 10 },
      { from_id: stationData.owner, standing: 10 },
    ];

    expect(await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH))
      .toBeCloseTo(1);
  });

  it("rises above base when standings are negative", async () => {
    trained();
    standings.data = [{ from_id: stationData.race_id, standing: -10 }];

    expect(
      await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH)
    ).toBeGreaterThan(3);
  });

  it("uses a citadel's own rate, untouched by Broker Relations", async () => {
    trained({ brokerRelations: 5 });
    standings.data = [{ from_id: stationData.race_id, standing: 10 }];
    const structure = getDefaultSaleStructure();

    const rate = await brokerFeeRate(
      resolveSaleLocation(structure.id),
      {},
      HASH
    );

    expect(rate).toBe(structure.brokerFee);
  });

  it("charges a signed-out seller the base with no reduction", async () => {
    trained({ brokerRelations: 5 });
    standings.data = [{ from_id: stationData.race_id, standing: 10 }];

    expect(await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, null))
      .toBeCloseTo(3);
  });
});

describe("sales tax rate", () => {
  it("is the base for an untrained character", () => {
    trained();

    expect(salesTaxRate({}, HASH)).toBeCloseTo(7.5);
  });

  it("comes down by a fraction of the base per Accounting level", () => {
    trained({ accounting: 5 });

    // Multiplicative: 7.5 × (1 − 0.11×5). Subtracting would give 6.95.
    expect(salesTaxRate({}, HASH)).toBeCloseTo(3.375);
  });

  it("charges a signed-out seller the base", () => {
    trained({ accounting: 5 });

    expect(salesTaxRate({}, null)).toBeCloseTo(7.5);
  });
});

describe("amounts", () => {
  it("takes the broker fee as a percentage of order value", () => {
    expect(brokerFeeAmount(1.3, 100_000_000)).toBeCloseTo(1_300_000);
  });

  it("never charges a broker fee below the floor", () => {
    expect(brokerFeeAmount(1.3, 1)).toBe(100);
  });

  it("takes sales tax as a percentage of sale value, with no floor", () => {
    expect(salesTaxAmount(3.375, 100_000_000)).toBeCloseTo(3_375_000);
    expect(salesTaxAmount(3.375, 1)).toBeLessThan(1);
  });
});

describe("seller skills", () => {
  it("reads both market skills off the cached map", () => {
    trained({ brokerRelations: 4, accounting: 2 });

    expect(getSellerSkills({}, HASH)).toEqual({
      brokerRelations: 4,
      accounting: 2,
    });
  });

  it("reads an untrained skill as level zero rather than undefined", () => {
    skills.data = {};

    expect(getSellerSkills({}, HASH)).toEqual({
      brokerRelations: 0,
      accounting: 0,
    });
  });
});

describe("the shape both stages share", () => {
  it("separates rate from amount so either stage can use either half", async () => {
    trained({ brokerRelations: 5, accounting: 5 });
    standings.data = [];
    const location = resolveSaleLocation(null, "jita");
    expect(location.kind).toBe(SALE_LOCATION_KIND.HUB);

    const value = 500_000_000;
    const fee = brokerFeeAmount(await brokerFeeRate(location, {}, HASH), value);
    const tax = salesTaxAmount(salesTaxRate({}, HASH), value);

    // 1.5% and 3.375% of the sale.
    expect(fee).toBeCloseTo(7_500_000);
    expect(tax).toBeCloseTo(16_875_000);
  });
});

// The station is read whether or not standings have resolved, as it was before the
// rate moved out of calcBrokersFee: a rate of base is the answer for a seller with
// no standings, not a reason to skip the lookup.
describe("standings that have not resolved", () => {
  it("still reads the station and charges the base rate", async () => {
    trained();
    standings.data = undefined;

    expect(
      await brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH)
    ).toBeCloseTo(3);
  });
});

// getStationData catches its own errors and resolves to null, so a failed lookup
// is indistinguishable from a station with no owner unless the rate reads through
// it. Quoting a fee from standings of zero would be plausible and wrong, and the
// Selling stage writes the fee it links into the job permanently.
describe("a station lookup that fails", () => {
  it("rejects rather than quoting a fee from standings it could not read", async () => {
    trained({ brokerRelations: 5 });
    standings.data = [{ from_id: stationData.race_id, standing: 10 }];
    station = null;

    await expect(
      brokerFeeRate(resolveSaleLocation(null, "jita"), {}, HASH)
    ).rejects.toThrow();

    station = stationData;
  });
});
