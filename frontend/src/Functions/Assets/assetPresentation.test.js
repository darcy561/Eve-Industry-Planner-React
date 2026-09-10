import { describe, expect, it } from "vitest";
import { locationPickerLabel } from "./assetPresentation";

// Without the distinction a failed lookup reads as an account holding nothing.
describe("what a location picker says when it has nothing to offer", () => {
  it("invites a choice once there is something to choose", () => {
    expect(
      locationPickerLabel({ count: 2, isLoading: false, isError: false })
    ).toBe("Select location");
  });

  it("says it is still looking", () => {
    expect(
      locationPickerLabel({ count: 0, isLoading: true, isError: false })
    ).toBe("Finding locations…");
  });

  it("separates being unable to look from finding nothing", () => {
    expect(
      locationPickerLabel({ count: 0, isLoading: false, isError: true })
    ).toBe("Locations unavailable");
    expect(
      locationPickerLabel({ count: 0, isLoading: false, isError: false })
    ).toBe("No locations found");
  });

  // Something to show beats saying why there might not be.
  it("prefers what it has over either", () => {
    expect(
      locationPickerLabel({ count: 1, isLoading: true, isError: true })
    ).toBe("Select location");
  });
});
