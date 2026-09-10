import { describe, expect, it } from "vitest";

import { resourceListText } from "./materialsAndSourcingPanel";

describe("the resources list a player copies", () => {
  it("gives one material and quantity a line, as the retired panel did", () => {
    const rows = [
      { name: "Tritanium", quantity: 10_000_000 },
      { name: "Isogen", quantity: 142_000 },
    ];

    expect(resourceListText(rows)).toBe("Tritanium 10000000\nIsogen 142000\n");
  });

  it("states the quantity the panel is showing, not always the whole job", () => {
    // The rows already carry whichever requirement the display toggle asked
    // for, so copying follows what is on screen.
    const rows = [{ name: "Tritanium", quantity: 250 }];

    expect(resourceListText(rows)).toBe("Tritanium 250\n");
  });

  it("copes with a job that needs nothing", () => {
    expect(resourceListText([])).toBe("\n");
  });
});
