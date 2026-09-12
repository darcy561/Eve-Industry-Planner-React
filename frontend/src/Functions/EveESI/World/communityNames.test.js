import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { readMock, submitMock } = vi.hoisted(() => ({
  readMock: vi.fn(),
  submitMock: vi.fn(),
}));

vi.mock("../../Endpoints/Private/citadelNames", () => ({
  readCommunityName: (...args) => readMock(...args),
  submitCommunityNames: (...args) => submitMock(...args),
}));

import {
  communityName,
  flushStructureNameSubmissions,
  submitStructureName,
} from "./communityNames";

const RAITARU = 1035466617946;
const SOTIYO = 1035466617947;

/** A structure as ESI answers for it. */
function esiStructure(name, extra = {}) {
  return {
    name,
    solar_system_id: 30000142,
    type_id: 35833,
    ...extra,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  readMock.mockReset().mockResolvedValue(null);
  submitMock.mockReset().mockResolvedValue(true);
});

afterEach(async () => {
  // Leave nothing queued for the next test to flush.
  vi.useRealTimers();
  submitMock.mockResolvedValue(true);
  await flushStructureNameSubmissions();
});

describe("reading a community name", () => {
  it("asks the store", async () => {
    readMock.mockResolvedValue({ name: "Someone Else's Raitaru" });

    await expect(communityName(RAITARU)).resolves.toEqual({
      name: "Someone Else's Raitaru",
    });
    expect(readMock).toHaveBeenCalledWith(RAITARU);
  });
});

describe("giving a name back to the community store", () => {
  // Naming a page of assets learns many structures at once; each is a row, not a request.
  it("sends what it has learned once, in one request", async () => {
    submitStructureName(RAITARU, esiStructure("Abbey Raitaru"));
    submitStructureName(SOTIYO, esiStructure("Abbey Sotiyo"));

    await vi.runAllTimersAsync();

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock.mock.calls[0][0].map((row) => row.id).sort()).toEqual(
      [RAITARU, SOTIYO].sort(),
    );
  });

  it("keeps only the last thing it learned about a structure", async () => {
    submitStructureName(RAITARU, esiStructure("Old Name"));
    submitStructureName(RAITARU, esiStructure("Renamed"));

    await vi.runAllTimersAsync();

    expect(submitMock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ id: RAITARU, name: "Renamed" }),
    ]);
  });

  it("submits nothing for a structure ESI did not name", async () => {
    submitStructureName(RAITARU, esiStructure("   "));
    submitStructureName(SOTIYO, null);

    await vi.runAllTimersAsync();

    expect(submitMock).not.toHaveBeenCalled();
  });

  // A store that was briefly unreachable must not cost the names already learned.
  it("keeps what it could not send, and sends it next time", async () => {
    submitMock.mockResolvedValue(false);
    submitStructureName(RAITARU, esiStructure("Abbey Raitaru"));
    await vi.runAllTimersAsync();
    expect(submitMock).toHaveBeenCalledTimes(1);

    submitMock.mockResolvedValue(true);
    await flushStructureNameSubmissions();

    expect(submitMock).toHaveBeenCalledTimes(2);
    expect(submitMock.mock.calls[1][0]).toEqual([
      expect.objectContaining({ id: RAITARU }),
    ]);
  });

  it("has nothing to send when nothing was learned", async () => {
    await flushStructureNameSubmissions();

    expect(submitMock).not.toHaveBeenCalled();
  });
});
