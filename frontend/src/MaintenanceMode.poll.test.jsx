import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";

const refreshAppConfig = vi.fn(async () => {});
vi.mock("./Functions/Endpoints/Public/appConfig.js", () => ({
  refreshAppConfig: (...args) => refreshAppConfig(...args),
}));

const { default: MaintenanceMode } = await import("./MaintenanceMode.jsx");
const { default: GLOBAL_CONFIG } = await import("./global-config-app.js");

const tick = GLOBAL_CONFIG.MAINTENANCE_RECOVERY_POLL_INTERVAL * 1000;

// While the banner is up the socket is gone, so this poll is the only way the
// tab learns the window ended; and it must stop the moment the banner does.
describe("the banner polls app-config while shown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refreshAppConfig.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("polls on the recovery interval and stops on unmount", () => {
    const { unmount } = render(<MaintenanceMode />);
    expect(refreshAppConfig).not.toHaveBeenCalled();

    vi.advanceTimersByTime(tick * 2);
    expect(refreshAppConfig).toHaveBeenCalledTimes(2);

    unmount();
    vi.advanceTimersByTime(tick * 2);
    expect(refreshAppConfig).toHaveBeenCalledTimes(2);
  });
});
