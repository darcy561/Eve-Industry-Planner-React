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
  ])("sends them to the dashboard rather than back into %s", (path) => {
    expect(getRedirectPathAfterAuth(path)).toBe("/dashboard");
  });

  // A job or group id means nothing to a reader who is not signed in yet.
  it.each(["/editjob/abc123", "/group/g-1"])(
    "treats %s as protected",
    (path) => {
      expect(getRedirectPathAfterAuth(path)).toBe("/dashboard");
    },
  );

  it("keeps the search a public path carried", () => {
    expect(getRedirectPathAfterAuth("/jobplanner?tab=2")).toBe(
      "/jobplanner?tab=2",
    );
  });

  it("does not let a search string smuggle a protected page through", () => {
    expect(getRedirectPathAfterAuth("/dashboard?a=1")).toBe("/dashboard");
  });

  it("sends them to the dashboard when they came from nowhere", () => {
    expect(getRedirectPathAfterAuth(null)).toBe("/dashboard");
    expect(getRedirectPathAfterAuth(undefined)).toBe("/dashboard");
  });

  // EVE returns the `state` the login sent, which carries a discriminator rather
  // than a path. Handing one to the router resolves it against `/auth`.
  it.each(["main", "additional:a1b2c3", ""])(
    "refuses %s, which is a state value and not a path",
    (state) => {
      expect(getRedirectPathAfterAuth(state)).toBe("/dashboard");
    },
  );

  // The guard that would have caught the original defect: path-shaped is not enough,
  // the app has to actually have the route.
  it.each(["/nonsense", "/dashboard/extra", "/editjob", "/editjob/a/b"])(
    "refuses %s, which is no route this app has",
    (path) => {
      expect(getRedirectPathAfterAuth(path)).toBe("/dashboard");
    },
  );

  it("honours a caller's own default", () => {
    expect(getRedirectPathAfterAuth("/settings", "/")).toBe("/");
  });
});
