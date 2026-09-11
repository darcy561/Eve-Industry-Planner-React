import { describe, expect, it } from "vitest";

import {
  STRUCTURE_SCOPE,
  scopesFromAccessToken,
  tokenHasScope,
} from "./tokenScopes";

/** An access token carries its claims in the middle segment, base64url encoded. */
function tokenWith(claims) {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${payload}.signature`;
}

describe("scopesFromAccessToken", () => {
  it("reads the scopes a token was issued with", () => {
    const token = tokenWith({
      scp: [STRUCTURE_SCOPE, "esi-skills.read_skills.v1"],
    });

    expect(scopesFromAccessToken(token)).toEqual([
      STRUCTURE_SCOPE,
      "esi-skills.read_skills.v1",
    ]);
  });

  it("reads a single scope, which arrives as a bare string", () => {
    expect(scopesFromAccessToken(tokenWith({ scp: STRUCTURE_SCOPE }))).toEqual([
      STRUCTURE_SCOPE,
    ]);
  });

  it.each(["", "not a token", "header.%%%.signature", null, undefined])(
    "answers with nothing it cannot read (%s)",
    (token) => {
      expect(scopesFromAccessToken(token)).toEqual([]);
    },
  );
});

describe("tokenHasScope", () => {
  it("says when a token was never granted the scope", () => {
    const token = tokenWith({ scp: ["esi-assets.read_assets.v1"] });

    expect(tokenHasScope(token, STRUCTURE_SCOPE)).toBe(false);
  });

  it("says when it was", () => {
    const token = tokenWith({
      scp: ["esi-assets.read_assets.v1", STRUCTURE_SCOPE],
    });

    expect(tokenHasScope(token, STRUCTURE_SCOPE)).toBe(true);
  });

  // Refusing to ask on the strength of a token we could not read would turn a parsing problem into
  // a permissions verdict. Let ESI answer instead.
  it("asks anyway when the claims cannot be read", () => {
    expect(tokenHasScope("not a token", STRUCTURE_SCOPE)).toBe(true);
  });
});
