import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { requestAppConfigRecheck } = await import(
  "../../../Events/appConfigEvents.js"
);
const { getAppConfig } = await import("./appConfig.js");

function appConfigResponse(maintenanceMode) {
  return new Response(
    JSON.stringify({
      app_version_number: "test",
      maintenance_mode: maintenanceMode,
      feature_flags: {},
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("app-config re-reads on a recheck request", () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  // This is the entry path: a live tab has no timer due for up to half an hour,
  // so the first refused call or the maintenance close is what brings the banner up.
  test("a recheck fetches app-config and the banner state follows", async () => {
    fetchSpy.mockResolvedValue(appConfigResponse(true));
    expect(getAppConfig().maintenance_mode).toBe(false);

    requestAppConfigRecheck();

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
      expect(getAppConfig().maintenance_mode).toBe(true);
    });
    const [url] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/v1/app-config");
  });
});
