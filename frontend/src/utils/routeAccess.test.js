import { describe, expect, it } from "vitest";
import { allRoutes, ROUTE_AUDIENCES, routeForPath } from "./routeAccess";

describe("what every route declares", () => {
  // The declaration is what the guard will act on, so a route that never made one
  // must not be able to reach production quietly.
  it("leaves no route without an audience", () => {
    const silent = allRoutes()
      .filter((route) => !route.declared)
      .map((route) => route.pattern);

    expect(silent).toEqual([]);
  });

  it("only uses audiences the app knows", () => {
    for (const route of allRoutes()) {
      expect(ROUTE_AUDIENCES).toContain(route.audience);
    }
  });

  // The layout is the existing mechanism; a child of it declaring itself public would
  // mean the two disagree about the same route.
  it("keeps the _protected children and their declarations in step", () => {
    const disagreeing = allRoutes()
      .filter(
        (route) => route.underProtectedLayout && route.audience !== "private",
      )
      .map((route) => route.pattern);

    expect(disagreeing).toEqual([]);
  });

  it("treats an undeclared route as private", () => {
    expect(
      allRoutes().every(
        (route) => route.declared || route.audience === "private",
      ),
    ).toBe(true);
  });
});

describe("finding the route a path belongs to", () => {
  it.each([
    ["/jobplanner", "/jobplanner", "public"],
    ["/settings", "/settings", "private"],
    ["/auth", "/auth", "transient"],
    ["/editjob/abc123", "/editjob/$jobID", "public"],
    ["/group/g-1", "/group/$groupID", "public"],
  ])("matches %s to %s", (path, pattern, audience) => {
    const route = routeForPath(path);

    expect(route?.pattern).toBe(pattern);
    expect(route?.audience).toBe(audience);
  });

  // A literal route and a param route are the same shape; only the order decides.
  it("reads /group/new as itself rather than as a group id", () => {
    expect(routeForPath("/group/new")?.pattern).toBe("/group/new");
  });

  it("ignores the search when matching, and keeps the route it found", () => {
    expect(routeForPath("/editjob/abc?activeGroup=g1")?.pattern).toBe(
      "/editjob/$jobID",
    );
  });

  it.each(["/nonsense", "/dashboard/extra", "/editjob", "/editjob/a/b"])(
    "has no route for %s",
    (path) => {
      expect(routeForPath(path)).toBeUndefined();
    },
  );
});

describe("resuming a stored session", () => {
  it("is on for the pages a reader is sent a link to", () => {
    for (const path of ["/jobplanner", "/editjob/abc", "/group/g-1"]) {
      expect(routeForPath(path)?.resumeSession).toBe(true);
    }
  });

  // The marketing page stays readable signed in; the session resumes on the first
  // real page instead.
  it("is off for the landing page", () => {
    expect(routeForPath("/")?.resumeSession).toBe(false);
  });
});
