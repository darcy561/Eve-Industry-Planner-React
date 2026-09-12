import { describe, expect, it } from "vitest";
import { getRedirectPathAfterAuth } from "./routeUtils";

describe("where a reader lands after signing in", () => {
  it.each(["/jobplanner", "/reprocessing", "/itemtrees", "/group/new"])(
    "goes back to %s, a public page they could have been on",
    (path) => {
      expect(getRedirectPathAfterAuth(path)).toBe(path);
    },
  );

  it.each([
    "/dashboard",
    "/settings",
    "/accounts",
    "/archived-jobs",
    "/first-login",
  ])("goes back to %s, where they were headed", (path) => {
    expect(getRedirectPathAfterAuth(path)).toBe(path);
  });

  // These are the share and deep-link targets: a reader sent to sign in from one comes
  // back to it rather than being dropped on the dashboard.
  it.each(["/editjob/abc123", "/group/g-1"])("goes back to %s", (path) => {
    expect(getRedirectPathAfterAuth(path)).toBe(path);
  });

  it("keeps the search a public path carried", () => {
    expect(getRedirectPathAfterAuth("/jobplanner?tab=2")).toBe(
      "/jobplanner?tab=2",
    );
  });

  it("keeps the search a private path carried", () => {
    expect(getRedirectPathAfterAuth("/dashboard?a=1")).toBe("/dashboard?a=1");
  });

  it("sends them to the dashboard when they came from nowhere", () => {
    expect(getRedirectPathAfterAuth(null)).toBe("/dashboard");
    expect(getRedirectPathAfterAuth(undefined)).toBe("/dashboard");
  });

  it.each(["main", "additional:a1b2c3", ""])(
    "refuses %s, which is not a path at all",
    (value) => {
      expect(getRedirectPathAfterAuth(value)).toBe("/dashboard");
    },
  );

  // Nothing has to spot these individually: a value only survives if it matches a
  // route the app has, segment for segment, and none of these do.
  it.each([
    "/\\evil.example",
    "/%2Fevil.example",
    "https://evil.example/jobplanner",
    "/jobplanner/../settings",
  ])("refuses %s, which is no route this app has", (value) => {
    expect(getRedirectPathAfterAuth(value)).toBe("/dashboard");
  });

  // A protocol-relative URL leaves the site while reading as a path.
  it.each(["//evil.example", "//evil.example/jobplanner"])(
    "refuses %s, which leaves the site",
    (value) => {
      expect(getRedirectPathAfterAuth(value)).toBe("/dashboard");
    },
  );

  // Somewhere a reader passes through, never somewhere to be put back.
  it.each(["/auth", "/signout"])("refuses %s, which is transient", (path) => {
    expect(getRedirectPathAfterAuth(path)).toBe("/dashboard");
  });

  // The guard that would have caught the original defect: path-shaped is not enough,
  // the app has to actually have the route.
  it.each(["/nonsense", "/dashboard/extra", "/editjob", "/editjob/a/b"])(
    "refuses %s, which is no route this app has",
    (path) => {
      expect(getRedirectPathAfterAuth(path)).toBe("/dashboard");
    },
  );

  it("honours a caller's own default", () => {
    expect(getRedirectPathAfterAuth("/nonsense", "/")).toBe("/");
  });
});
