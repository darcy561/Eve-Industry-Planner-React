import { describe, expect, it } from "vitest";

import { LOCATION_OUTCOME, isRefusalStatus } from "./locationOutcome";
import { LOCATION_RESOLUTION_STATUS } from "../../Assets/assetLocationConstants";

describe("LOCATION_OUTCOME", () => {
  // The surfaces that read a resolution status — an asset tree row's `unreadable` flag, the
  // location lists, the office select — read the older constant. The two are the same strings on
  // purpose, and a resolver stamping one while a view tests the other would classify silently
  // wrongly rather than fail.
  it("carries the same values the resolution status constants do", () => {
    expect(LOCATION_OUTCOME.NAMED).toBe(LOCATION_RESOLUTION_STATUS.RESOLVED);
    expect(LOCATION_OUTCOME.COMMUNITY).toBe(
      LOCATION_RESOLUTION_STATUS.COMMUNITY
    );
    expect(LOCATION_OUTCOME.NO_ACCESS).toBe(
      LOCATION_RESOLUTION_STATUS.NO_ACCESS
    );
  });
});

describe("isRefusalStatus", () => {
  it.each([403, 404])("treats %i as an answer of you cannot see this", (status) => {
    expect(isRefusalStatus(status)).toBe(true);
  });

  // A token that failed validation can succeed after a refresh, so 401 is worth asking again.
  it.each([401, 420, 500, 502, 503, 504])(
    "treats %i as a failure to be asked again",
    (status) => {
      expect(isRefusalStatus(status)).toBe(false);
    }
  );
});
