import { describe, expect, it } from "vitest";
import { getAuthCallbackParams } from "./oauthUrlParams.js";

describe("getAuthCallbackParams", () => {
  it("reads the code and state EVE SSO returns", () => {
    expect(getAuthCallbackParams("?code=abc123&state=main")).toEqual({
      authCode: "abc123",
      state: "main",
    });
  });

  it("is null for a callback carrying neither", () => {
    expect(getAuthCallbackParams("?error=access_denied")).toEqual({
      authCode: null,
      state: null,
    });
  });
});
