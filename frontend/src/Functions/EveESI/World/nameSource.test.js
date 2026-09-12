import { describe, expect, it } from "vitest";
import nameSource, { NAME_SOURCE } from "./nameSource";

describe("where a location's name can be got", () => {
  it.each([
    [10000002, NAME_SOURCE.BULK],
    [20000020, NAME_SOURCE.BULK],
    [30000142, NAME_SOURCE.BULK],
    [32000001, NAME_SOURCE.BULK],
    [60003760, NAME_SOURCE.BULK],
    [1035466617946, NAME_SOURCE.CHARACTER],
  ])("asks for %i where it can be answered", (id, source) => {
    expect(nameSource(id)).toBe(source);
  });

  // `POST /universe/names` answers for regions, constellations, systems and stations, and refuses
  // the whole call over anything else — so these must never be batched with ids that can be named.
  it.each([
    [40009077, "a planet"],
    [50001248, "a stargate"],
    [66000001, "a station's office folder"],
    [2004, "asset safety"],
    [999999, "an id in no documented range"],
  ])("asks nowhere about %i (%s)", (id) => {
    expect(nameSource(id)).toBe(NAME_SOURCE.NONE);
  });
});

// The ids of characters, corporations, alliances and factions are not places, and are named by the
// same call as a station. One cache answers for all of them.
describe("naming something that is not a place", () => {
  it.each([
    [500001, "a faction"],
    [1000035, "an NPC corporation"],
    [3019582, "an NPC character"],
    [98000001, "a corporation"],
    [99000001, "an alliance"],
    [2117028121, "a character"],
    [1234567890, "a character from before 2010"],
  ])("asks the bulk lookup about %i (%s)", (id) => {
    expect(nameSource(id)).toBe(NAME_SOURCE.BULK);
  });
});
