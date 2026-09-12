import { describe, expect, it, vi } from "vitest";

vi.mock("../../../utils/runtime-config", () => ({
  getRuntimeEnv: (key) => `env:${key}`,
}));

const { getEveSsoAuthorizeUrl } = await import("./eveSSORedirect.js");

describe("the authorize URL", () => {
  it("carries the state it is given and the runtime environment", () => {
    const url = new URL(getEveSsoAuthorizeUrl("a-nonce"));

    expect(url.origin + url.pathname).toBe(
      "https://login.eveonline.com/v2/oauth/authorize/",
    );
    expect(url.searchParams.get("state")).toBe("a-nonce");
    expect(url.searchParams.get("redirect_uri")).toBe("env:EVE_CALLBACK_URL");
  });
});

describe("the state a departure carries", () => {
  it("is where the reader was headed, when they were sent here from it", () => {
    expect(getEveSsoAuthorizeUrl("/settings?tab=alerts")).toContain(
      `state=${encodeURIComponent("/settings?tab=alerts")}`,
    );
  });

  it("is an additional-account handshake when that is what it is given", () => {
    expect(getEveSsoAuthorizeUrl("additional:nonce-1")).toContain(
      `state=${encodeURIComponent("additional:nonce-1")}`,
    );
  });
});
