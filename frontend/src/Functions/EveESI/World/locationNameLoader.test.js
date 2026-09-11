import { beforeEach, describe, expect, it, vi } from "vitest";

const { namesMock, structureMock, communityMock } = vi.hoisted(() => ({
  namesMock: vi.fn(),
  structureMock: vi.fn(),
  communityMock: vi.fn(),
}));

vi.mock("./getUniverseNames", () => ({
  default: (...args) => namesMock(...args),
}));

vi.mock("./getCitadelData", () => ({
  fetchStructureName: (...args) => structureMock(...args),
  communityNameOrRefusal: (...args) => communityMock(...args),
}));

import { requestLocationName } from "./locationNameLoader";
import { LOCATION_OUTCOME, LocationResolutionError } from "./locationOutcome";

const JITA = 60003760;
const AMARR = 60008494;
const RAITARU = 1035466617946;
const SOTIYO = 1035466617947;

const alt = { CharacterHash: "hash-b" };
const main = { CharacterHash: "hash-a" };
const characters = [main, alt];

const named = (id, name) => ({
  id,
  name,
  resolutionStatus: LOCATION_OUTCOME.NAMED,
});

beforeEach(() => {
  namesMock.mockReset().mockResolvedValue([]);
  structureMock.mockReset();
  communityMock.mockReset();
});

describe("requestLocationName", () => {
  it("asks for everything raised in one tick in a single call", async () => {
    namesMock.mockResolvedValue([
      named(JITA, "Jita IV-4"),
      named(AMARR, "Amarr VIII"),
    ]);

    const [jita, amarr] = await Promise.all([
      requestLocationName(JITA, characters),
      requestLocationName(AMARR, characters),
    ]);

    expect(namesMock).toHaveBeenCalledTimes(1);
    expect(namesMock).toHaveBeenCalledWith([JITA, AMARR]);
    expect(jita.name).toBe("Jita IV-4");
    expect(amarr.name).toBe("Amarr VIII");
  });

  it("splits a batch larger than one call into calls of a thousand", async () => {
    const ids = Array.from({ length: 1500 }, (_, i) => 60000000 + i);
    namesMock.mockImplementation(async (batch) =>
      batch.map((id) => named(id, `Station ${id}`)),
    );

    await Promise.all(ids.map((id) => requestLocationName(id, characters)));

    expect(namesMock).toHaveBeenCalledTimes(2);
    expect(namesMock.mock.calls[0][0]).toHaveLength(1000);
    expect(namesMock.mock.calls[1][0]).toHaveLength(500);
  });

  it("asks once when two callers want the same id in one tick", async () => {
    namesMock.mockResolvedValue([named(JITA, "Jita IV-4")]);

    const [first, second] = await Promise.all([
      requestLocationName(JITA, characters),
      requestLocationName(JITA, characters),
    ]);

    expect(namesMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("settles an id ESI did not mention as unnamed rather than asking forever", async () => {
    namesMock.mockResolvedValue([]);

    const outcome = await requestLocationName(JITA, characters);

    expect(outcome.resolutionStatus).toBe(LOCATION_OUTCOME.UNNAMED);
    expect(outcome.name).toBeUndefined();
  });

  it("fails the ids a failed call spoke for, rather than answering with nothing", async () => {
    namesMock.mockRejectedValue(new LocationResolutionError("esi down"));

    await expect(requestLocationName(JITA, characters)).rejects.toBeInstanceOf(
      LocationResolutionError,
    );
  });

  it("asks the next character when one is refused", async () => {
    structureMock.mockImplementation(async (id, character) =>
      character === alt
        ? { refused: false, name: named(id, "Home Raitaru") }
        : { refused: true },
    );

    const outcome = await requestLocationName(RAITARU, characters);

    expect(outcome.name).toBe("Home Raitaru");
    expect(communityMock).not.toHaveBeenCalled();
  });

  it("asks the community store only once every character has been refused", async () => {
    structureMock.mockResolvedValue({ refused: true });
    communityMock.mockResolvedValue({
      id: RAITARU,
      name: "Someone Else's Raitaru",
      resolutionStatus: LOCATION_OUTCOME.COMMUNITY,
    });

    const outcome = await requestLocationName(RAITARU, characters);

    expect(structureMock).toHaveBeenCalledTimes(2);
    expect(outcome.resolutionStatus).toBe(LOCATION_OUTCOME.COMMUNITY);
  });

  // The character that failed may have been the one that could see it, so the account has not
  // established that it cannot — settling here is what made a transient failure permanent.
  it("fails rather than settling when a character could not ask at all", async () => {
    structureMock.mockImplementation(async (id, character) => {
      if (character === main) throw new LocationResolutionError("token gone");
      return { refused: true };
    });

    await expect(
      requestLocationName(RAITARU, characters),
    ).rejects.toBeInstanceOf(LocationResolutionError);
    expect(communityMock).not.toHaveBeenCalled();
  });

  it("batches a structure and a station together without confusing them", async () => {
    namesMock.mockResolvedValue([named(JITA, "Jita IV-4")]);
    structureMock.mockResolvedValue({
      refused: false,
      name: named(SOTIYO, "Big Sotiyo"),
    });

    const [station, structure] = await Promise.all([
      requestLocationName(JITA, characters),
      requestLocationName(SOTIYO, characters),
    ]);

    expect(namesMock).toHaveBeenCalledWith([JITA]);
    expect(structure.name).toBe("Big Sotiyo");
    expect(station.name).toBe("Jita IV-4");
  });

  // A market history asks for a region, which the structure endpoint answers for nobody.
  it("asks the bulk lookup for a region rather than a character's token", async () => {
    const THE_FORGE = 10000002;
    namesMock.mockResolvedValue([named(THE_FORGE, "The Forge")]);

    const outcome = await requestLocationName(THE_FORGE, characters);

    expect(namesMock).toHaveBeenCalledWith([THE_FORGE]);
    expect(structureMock).not.toHaveBeenCalled();
    expect(outcome.name).toBe("The Forge");
  });

  // The account has established nothing about the structure if nobody was in a position to ask.
  it("does not settle as no access when no character may read structures", async () => {
    structureMock.mockImplementation(async () => {
      const err = new LocationResolutionError("token lacks the scope");
      err.needsReauthorisation = true;
      throw err;
    });

    await expect(
      requestLocationName(RAITARU, characters),
    ).rejects.toMatchObject({ needsReauthorisation: true });
    expect(communityMock).not.toHaveBeenCalled();
  });

  it("still settles on a refusal when one character could ask and was refused", async () => {
    structureMock.mockImplementation(async (id, character) => {
      if (character === main) {
        const err = new LocationResolutionError("token lacks the scope");
        err.needsReauthorisation = true;
        throw err;
      }
      return { refused: true };
    });
    communityMock.mockResolvedValue({
      id: RAITARU,
      name: "Someone Else's Raitaru",
      resolutionStatus: LOCATION_OUTCOME.COMMUNITY,
    });

    const outcome = await requestLocationName(RAITARU, characters);

    expect(outcome.resolutionStatus).toBe(LOCATION_OUTCOME.COMMUNITY);
  });

  it("fails an id it has no character to ask with", async () => {
    await expect(requestLocationName(RAITARU, [])).rejects.toBeInstanceOf(
      LocationResolutionError,
    );
  });
});
