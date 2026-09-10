import { describe, expect, it } from "vitest";
import { ASSET_OWNER, readScopeValue, scopeValue } from "./assetScopePicker";

describe("naming whose assets a view is showing", () => {
  it("reads back what it wrote", () => {
    const scope = { kind: ASSET_OWNER.CHARACTER, id: "abc123" };

    expect(readScopeValue(scopeValue(scope))).toEqual(scope);
  });

  it("keeps a corporation id whole", () => {
    expect(readScopeValue(scopeValue({ kind: ASSET_OWNER.CORPORATION, id: 98000001 }))).toEqual({
      kind: "corporation",
      id: "98000001",
    });
  });

  // A character hash is opaque and may hold anything; only the first separator delimits the kind.
  it("keeps a hash containing a separator whole", () => {
    const id = "a:b:c";

    expect(readScopeValue(scopeValue({ kind: ASSET_OWNER.CHARACTER, id })).id).toBe(id);
  });
});
