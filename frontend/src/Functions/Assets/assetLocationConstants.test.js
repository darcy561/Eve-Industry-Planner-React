import { describe, expect, it } from "vitest";
import {
  LOCATION_KIND,
  LOCATION_NAME_SOURCE,
  locationNameSource,
  resolveLocationKind,
} from "./assetLocationConstants";

// The ranges EVE publishes: https://developers.eveonline.com/docs/guides/id-ranges/
describe("what an id says about the place it names", () => {
  it.each([
    [2004, LOCATION_KIND.ASSET_SAFETY],
    [10000002, LOCATION_KIND.REGION], // The Forge
    [11000001, LOCATION_KIND.REGION], // wormhole region
    [19000001, LOCATION_KIND.REGION], // hidden region
    [20000020, LOCATION_KIND.CONSTELLATION],
    [26000001, LOCATION_KIND.CONSTELLATION], // hidden constellation
    [30000142, LOCATION_KIND.SYSTEM], // Jita
    [31000001, LOCATION_KIND.SYSTEM], // wormhole system
    [36000001, LOCATION_KIND.SYSTEM], // hidden system
    [32000001, LOCATION_KIND.ABYSSAL_SYSTEM],
    [40009077, LOCATION_KIND.CELESTIAL], // a planet in Jita
    [50001248, LOCATION_KIND.STARGATE], // a gate out of Jita
    [60003760, LOCATION_KIND.STATION], // Jita IV-4
    [61000001, LOCATION_KIND.STATION], // an outpost
    [66000001, LOCATION_KIND.STATION_FOLDER],
    [1035466617946, LOCATION_KIND.STRUCTURE],
    [999999, LOCATION_KIND.UNKNOWN],
    [2117028121, LOCATION_KIND.UNKNOWN], // a character id, which is not a place
  ])("classifies %i", (id, kind) => {
    expect(resolveLocationKind(id)).toBe(kind);
  });

  // Each range's last id and the next one along. A range shifted by one, or a `<` loosened to a
  // `<=`, reads exactly like a correct one from the middle of a range.
  it.each([
    [9999999, LOCATION_KIND.UNKNOWN],
    [10000000, LOCATION_KIND.REGION],
    [19999999, LOCATION_KIND.REGION],
    [20000000, LOCATION_KIND.CONSTELLATION],
    [29999999, LOCATION_KIND.CONSTELLATION],
    [30000000, LOCATION_KIND.SYSTEM],
    [31999999, LOCATION_KIND.SYSTEM],
    [32000000, LOCATION_KIND.ABYSSAL_SYSTEM],
    [32999999, LOCATION_KIND.ABYSSAL_SYSTEM],
    [33000000, LOCATION_KIND.SYSTEM],
    [39999999, LOCATION_KIND.SYSTEM],
    [40000000, LOCATION_KIND.CELESTIAL],
    [49999999, LOCATION_KIND.CELESTIAL],
    [50000000, LOCATION_KIND.STARGATE],
    [59999999, LOCATION_KIND.STARGATE],
    [60000000, LOCATION_KIND.STATION],
    [63999999, LOCATION_KIND.STATION],
    // Unlabelled in EVE's table, so neither a station nor a folder.
    [64000000, LOCATION_KIND.UNKNOWN],
    [65999999, LOCATION_KIND.UNKNOWN],
    [66000000, LOCATION_KIND.STATION_FOLDER],
    [69999999, LOCATION_KIND.STATION_FOLDER],
    [70000000, LOCATION_KIND.UNKNOWN],
    [999999999999, LOCATION_KIND.UNKNOWN],
    [1000000000000, LOCATION_KIND.STRUCTURE],
  ])("classifies the edge %i", (id, kind) => {
    expect(resolveLocationKind(id)).toBe(kind);
  });

  // The defect this classification exists to stop: an id matching nothing used to be taken for a
  // structure, and a structure is asked of every linked character in turn.
  it("does not take an id in no documented range for a structure", () => {
    expect(resolveLocationKind(999999)).not.toBe(LOCATION_KIND.STRUCTURE);
    expect(resolveLocationKind(2117028121)).not.toBe(LOCATION_KIND.STRUCTURE);
  });
});

describe("where a location's name can be got", () => {
  it.each([
    [10000002, LOCATION_NAME_SOURCE.BULK],
    [20000020, LOCATION_NAME_SOURCE.BULK],
    [30000142, LOCATION_NAME_SOURCE.BULK],
    [32000001, LOCATION_NAME_SOURCE.BULK],
    [60003760, LOCATION_NAME_SOURCE.BULK],
    [1035466617946, LOCATION_NAME_SOURCE.CHARACTER],
  ])("asks for %i where it can be answered", (id, source) => {
    expect(locationNameSource(id)).toBe(source);
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
    expect(locationNameSource(id)).toBe(LOCATION_NAME_SOURCE.NONE);
  });
});
