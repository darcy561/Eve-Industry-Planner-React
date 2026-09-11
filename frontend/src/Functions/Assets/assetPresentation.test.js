import { describe, expect, it } from "vitest";
import { assetImageUrl, locationPickerLabel } from "./assetPresentation";
import {
  ANCIENT_RELIC_TYPE_ID,
  assetFixtureItemList,
} from "../../tests/assetFixtures";

// Without the distinction a failed lookup reads as an account holding nothing.
describe("what a location picker says when it has nothing to offer", () => {
  it("invites a choice once there is something to choose", () => {
    expect(
      locationPickerLabel({ count: 2, isLoading: false, isError: false }),
    ).toBe("Select location");
  });

  it("says it is still looking", () => {
    expect(
      locationPickerLabel({ count: 0, isLoading: true, isError: false }),
    ).toBe("Finding locations…");
  });

  it("separates being unable to look from finding nothing", () => {
    expect(
      locationPickerLabel({ count: 0, isLoading: false, isError: true }),
    ).toBe("Locations unavailable");
    expect(
      locationPickerLabel({ count: 0, isLoading: false, isError: false }),
    ).toBe("No locations found");
  });

  // Something to show beats saying why there might not be.
  it("prefers what it has over either", () => {
    expect(
      locationPickerLabel({ count: 1, isLoading: true, isError: true }),
    ).toBe("Select location");
  });
});

// EVE serves a relic only as `relic`: asking for its `icon` is answered with a 400 and no image.
describe("the image a node is drawn with", () => {
  it("asks for an icon for an ordinary item", () => {
    expect(assetImageUrl({ typeId: 34 }, assetFixtureItemList)).toContain(
      "/types/34/icon",
    );
  });

  it("asks for the relic variant for an ancient relic", () => {
    expect(
      assetImageUrl({ typeId: ANCIENT_RELIC_TYPE_ID }, assetFixtureItemList),
    ).toContain(`/types/${ANCIENT_RELIC_TYPE_ID}/relic`);
  });

  it("asks for an icon when nothing names the type", () => {
    expect(assetImageUrl({ typeId: 34 })).toContain("/types/34/icon");
  });
});
