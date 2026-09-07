import { beforeEach, describe, expect, test, vi } from "vitest";

const requestAppConfigRecheck = vi.fn();
vi.mock("../../Events/appConfigEvents.js", () => ({
  requestAppConfigRecheck: (...args) => requestAppConfigRecheck(...args),
}));

const { withRequestRetries, mergeApiRetryOptions, isMaintenanceResponse } =
  await import("./withRequestRetries.js");

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const maintenanceRefusal = () =>
  jsonResponse(503, { error: "maintenance_mode", maintenance_mode: true });

describe("isMaintenanceResponse", () => {
  test("recognises the API maintenance refusal", async () => {
    expect(await isMaintenanceResponse(maintenanceRefusal())).toBe(true);
  });

  test("ignores other 503s and other statuses", async () => {
    expect(await isMaintenanceResponse(jsonResponse(503, { error: "draining" }))).toBe(false);
    expect(await isMaintenanceResponse(new Response("down", { status: 503 }))).toBe(false);
    expect(await isMaintenanceResponse(jsonResponse(500, { error: "maintenance_mode" }))).toBe(false);
    expect(await isMaintenanceResponse(undefined)).toBe(false);
  });

  // The check reads a clone, so the caller can still read the body it was handed.
  test("leaves the body readable", async () => {
    const res = maintenanceRefusal();
    await isMaintenanceResponse(res);
    expect((await res.json()).error).toBe("maintenance_mode");
  });
});

describe("withRequestRetries during maintenance", () => {
  beforeEach(() => {
    requestAppConfigRecheck.mockClear();
  });

  // A 503 is retriable by status, so without the terminal check every call would
  // burn its full attempt budget against a window before failing.
  test("a maintenance refusal is returned on the first attempt and signalled", async () => {
    const requestFn = vi.fn(async () => maintenanceRefusal());

    const res = await withRequestRetries(requestFn, mergeApiRetryOptions(undefined));

    expect(res.status).toBe(503);
    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(requestAppConfigRecheck).toHaveBeenCalledTimes(1);
  });

  test("an ordinary 503 still retries and signals nothing", async () => {
    const requestFn = vi.fn(async () => jsonResponse(503, { error: "upstream" }));

    const res = await withRequestRetries(requestFn, {
      ...mergeApiRetryOptions(undefined),
      maxAttempts: 3,
      baseDelayMs: 1,
    });

    expect(res.status).toBe(503);
    expect(requestFn).toHaveBeenCalledTimes(3);
    expect(requestAppConfigRecheck).not.toHaveBeenCalled();
  });

  // Callers that use the module directly, without the API defaults, keep the old
  // behaviour: nothing is terminal but success.
  test("no terminal check without the API defaults", async () => {
    const requestFn = vi.fn(async () => maintenanceRefusal());

    await withRequestRetries(requestFn, { maxAttempts: 2, baseDelayMs: 1 });

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(requestAppConfigRecheck).not.toHaveBeenCalled();
  });

  test("a per-call terminal check overrides the default", async () => {
    const requestFn = vi.fn(async () => jsonResponse(503, { error: "upstream" }));
    const isTerminalResponse = vi.fn(async () => true);

    await withRequestRetries(requestFn, mergeApiRetryOptions({ isTerminalResponse }));

    expect(requestFn).toHaveBeenCalledTimes(1);
    expect(isTerminalResponse).toHaveBeenCalledTimes(1);
  });
});
