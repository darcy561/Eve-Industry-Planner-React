import { beforeEach, describe, expect, it, vi } from "vitest";

const { worldData, addUniverseIDs, worldDataResponses, calls } = vi.hoisted(
  () => ({
    worldData: { universeIDs: {} },
    addUniverseIDs: vi.fn(),
    worldDataResponses: new Map(),
    calls: [],
  })
);

vi.mock("../../../Zustand/usersStore", () => ({
  default: {
    getState: () => ({
      worldData: { ...worldData, actions: { addUniverseIDs } },
    }),
  },
}));

vi.mock("./getWorldData", () => ({
  default: async (ids, character) => {
    calls.push({ ids: [...ids], hash: character.CharacterHash });
    return worldDataResponses.get(character.CharacterHash)?.([...ids]) ?? {};
  },
}));

import resolveLocationNames from "./resolveLocationNames";
import { LOCATION_RESOLUTION_STATUS } from "../../Assets/assetLocationConstants";

const RAITARU = 1035466617946;
const JITA = 60003760;

function named(id, name) {
  return {
    id,
    name,
    resolutionStatus: LOCATION_RESOLUTION_STATUS.RESOLVED,
  };
}

function refused(id) {
  return {
    id,
    name: `No Access To Location - ${id}`,
    resolutionStatus: LOCATION_RESOLUTION_STATUS.NO_ACCESS,
  };
}

const characters = [
  { CharacterHash: "hash-a" },
  { CharacterHash: "hash-b" },
  { CharacterHash: "hash-c" },
];

beforeEach(() => {
  worldData.universeIDs = {};
  addUniverseIDs.mockClear();
  worldDataResponses.clear();
  calls.length = 0;
});

describe("resolveLocationNames", () => {
  it("resolves nothing when asked for nothing", async () => {
    expect(await resolveLocationNames([], characters)).toEqual({});
    expect(calls).toHaveLength(0);
    expect(addUniverseIDs).not.toHaveBeenCalled();
  });

  it("stops asking once every location is named", async () => {
    worldDataResponses.set("hash-a", (ids) =>
      Object.fromEntries(ids.map((id) => [id, named(id, `station ${id}`)]))
    );

    const resolved = await resolveLocationNames([JITA], characters);

    expect(resolved[JITA].name).toBe(`station ${JITA}`);
    expect(calls.map((c) => c.hash)).toEqual(["hash-a"]);
  });

  // Docking rights are per pilot, so a refusal from one character says nothing about the next.
  // The refusal arrives as a named placeholder, which is what used to end the walk early.
  it("tries the next character when one is refused a structure", async () => {
    worldDataResponses.set("hash-a", (ids) =>
      Object.fromEntries(ids.map((id) => [id, refused(id)]))
    );
    worldDataResponses.set("hash-b", (ids) =>
      Object.fromEntries(ids.map((id) => [id, named(id, "Home Raitaru")]))
    );

    const resolved = await resolveLocationNames([RAITARU], characters);

    expect(resolved[RAITARU].name).toBe("Home Raitaru");
    expect(calls.map((c) => c.hash)).toEqual(["hash-a", "hash-b"]);
  });

  it("keeps the refusal when no character can name it", async () => {
    for (const { CharacterHash } of characters) {
      worldDataResponses.set(CharacterHash, (ids) =>
        Object.fromEntries(ids.map((id) => [id, refused(id)]))
      );
    }

    const resolved = await resolveLocationNames([RAITARU], characters);

    expect(resolved[RAITARU].resolutionStatus).toBe(
      LOCATION_RESOLUTION_STATUS.NO_ACCESS
    );
    expect(calls.map((c) => c.hash)).toEqual(["hash-a", "hash-b", "hash-c"]);
  });

  it("only asks a later character about what is still unnamed", async () => {
    worldDataResponses.set("hash-a", (ids) => ({
      [JITA]: named(JITA, "Jita IV-4"),
      [RAITARU]: refused(RAITARU),
    }));
    worldDataResponses.set("hash-b", (ids) => ({
      [RAITARU]: named(RAITARU, "Home Raitaru"),
    }));

    await resolveLocationNames([JITA, RAITARU], characters);

    expect(calls[0].ids).toEqual([JITA, RAITARU]);
    expect(calls[1].ids).toEqual([RAITARU]);
  });

  // Written once at the end: getWorldData skips whatever the store already holds, so a placeholder
  // written mid-walk would hide the id from the characters still to be tried.
  it("writes the store once, after every character has been tried", async () => {
    worldDataResponses.set("hash-a", (ids) =>
      Object.fromEntries(ids.map((id) => [id, refused(id)]))
    );
    worldDataResponses.set("hash-b", (ids) =>
      Object.fromEntries(ids.map((id) => [id, named(id, "Home Raitaru")]))
    );

    await resolveLocationNames([RAITARU], characters);

    expect(addUniverseIDs).toHaveBeenCalledTimes(1);
    expect(addUniverseIDs.mock.calls[0][0][RAITARU].name).toBe("Home Raitaru");
  });

  it("does not write the store when nothing resolved", async () => {
    await resolveLocationNames([RAITARU], characters);

    expect(addUniverseIDs).not.toHaveBeenCalled();
  });

  it("resolves nothing when the account has no characters", async () => {
    expect(await resolveLocationNames([RAITARU], [])).toEqual({});
    expect(calls).toHaveLength(0);
  });
});
