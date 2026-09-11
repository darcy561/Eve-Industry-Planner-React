import { describe, it, expect } from "vitest";
import {
  isTerminalPlannerAuthCode,
  parsePlannerAuthCodeFromText,
} from "./plannerSessionRedirect.js";

describe("plannerSessionRedirect", () => {
  it("parses reauth_required from JSON body", () => {
    expect(
      parsePlannerAuthCodeFromText(
        JSON.stringify({ code: "reauth_required", message: "Unauthorized" }),
      ),
    ).toBe("reauth_required");
  });

  // The stuck-session defect: a plain-text 401 yields no code, so nothing redirects and the tab
  // retries a dead refresh token on every request.
  it("yields no code for an uncoded plain-text rejection", () => {
    expect(parsePlannerAuthCodeFromText("Invalid token\n")).toBeNull();
  });

  it("treats reauth_required and session_revoked as terminal", () => {
    expect(isTerminalPlannerAuthCode("reauth_required")).toBe(true);
    expect(isTerminalPlannerAuthCode("session_revoked")).toBe(true);
    expect(isTerminalPlannerAuthCode("session_missing")).toBe(false);
  });
});
