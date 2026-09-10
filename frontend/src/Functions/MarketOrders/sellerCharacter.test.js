import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = {
  account: {
    characters: [],
    actions: {
      getMainCharacter: () =>
        storeState.account.characters.find((c) => c.isMainCharacter) ?? null,
      findCharacterByHash: (hash) =>
        storeState.account.characters.find((c) => c.CharacterHash === hash) ??
        null,
    },
  },
};

vi.mock("../../Zustand/usersStore", () => ({
  default: { getState: () => storeState },
}));

const { resolveSellerCharacter } = await import("./sellerCharacter");

const trader = {
  CharacterHash: "trader",
  CharacterName: "Market Alt",
  isMainCharacter: false,
};
const main = {
  CharacterHash: "main",
  CharacterName: "Main Pilot",
  isMainCharacter: true,
};

beforeEach(() => {
  storeState.account.characters = [main, trader];
});

describe("resolveSellerCharacter", () => {
  // The seller is a separate choice from the builder: market skills and the
  // standings grind usually sit on a trading alt, not on whoever runs the job.
  it("returns the chosen seller over the main", () => {
    expect(resolveSellerCharacter("trader")).toEqual({
      hash: "trader",
      name: "Market Alt",
      isDefault: false,
    });
  });

  it("stands in with the main until a seller is chosen", () => {
    expect(resolveSellerCharacter(null)).toEqual({
      hash: "main",
      name: "Main Pilot",
      isDefault: true,
    });
  });

  // A hash left behind by a character since removed from the account must not
  // quote that character's rates; it falls back and says it is a stand-in.
  it("falls back when the chosen seller is no longer on the account", () => {
    expect(resolveSellerCharacter("removed")).toEqual({
      hash: "main",
      name: "Main Pilot",
      isDefault: true,
    });
  });

  it("names nobody when signed out", () => {
    storeState.account.characters = [];

    expect(resolveSellerCharacter(null)).toEqual({
      hash: null,
      name: null,
      isDefault: true,
    });
  });
});
