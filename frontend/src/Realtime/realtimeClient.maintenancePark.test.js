import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const requestAppConfigRecheck = vi.fn();
vi.mock("../Events/appConfigEvents.js", () => ({
  requestAppConfigRecheck: (...args) => requestAppConfigRecheck(...args),
  subscribeToAppConfigRecheck: () => () => {},
}));

const {
  connectRealtime,
  parkRealtimeForMaintenance,
  resumeRealtimeAfterMaintenance,
  isRealtimeParkedForMaintenance,
  disconnectRealtime,
} = await import("./realtimeClient.js");

describe("realtime maintenance park", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    // disconnect clears the park so one test cannot leak into the next.
    disconnectRealtime();
    vi.restoreAllMocks();
  });

  test("starts unparked", () => {
    expect(isRealtimeParkedForMaintenance()).toBe(false);
  });

  test("parking is what stops the retry schedule", () => {
    parkRealtimeForMaintenance();
    expect(isRealtimeParkedForMaintenance()).toBe(true);
  });

  test("resuming lifts the park", () => {
    parkRealtimeForMaintenance();
    resumeRealtimeAfterMaintenance();
    expect(isRealtimeParkedForMaintenance()).toBe(false);
  });

  // Resuming when never parked is a no-op rather than a stray reconnect.
  test("resuming when not parked does nothing", () => {
    expect(isRealtimeParkedForMaintenance()).toBe(false);
    resumeRealtimeAfterMaintenance();
    expect(isRealtimeParkedForMaintenance()).toBe(false);
  });

  // Logging out during a window must not leave the next session parked.
  test("disconnecting clears the park", () => {
    parkRealtimeForMaintenance();
    disconnectRealtime();
    expect(isRealtimeParkedForMaintenance()).toBe(false);
  });

  // Parking twice is what a repeated announce or a re-render would do.
  test("parking is idempotent", () => {
    parkRealtimeForMaintenance();
    parkRealtimeForMaintenance();
    expect(isRealtimeParkedForMaintenance()).toBe(true);
    resumeRealtimeAfterMaintenance();
    expect(isRealtimeParkedForMaintenance()).toBe(false);
  });
});

// The browser gives a refused handshake no status, so the only thing the client
// can do is ask app-config why the socket would not open.
describe("a socket that will not open", () => {
  class FakeSocket {
    static OPEN = 1;
    static last = null;
    constructor() {
      this.listeners = {};
      this.readyState = 0;
      FakeSocket.last = this;
    }
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    }
    dispatch(type) {
      for (const fn of this.listeners[type] || []) fn({});
    }
    close() {}
    send() {}
  }

  beforeEach(() => {
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.spyOn(console, "info").mockImplementation(() => {});
    requestAppConfigRecheck.mockClear();
  });

  afterEach(() => {
    disconnectRealtime();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("closing before it opened asks app-config to recheck", () => {
    connectRealtime({ accountId: "acct-1" });
    FakeSocket.last.dispatch("close");
    expect(requestAppConfigRecheck).toHaveBeenCalledTimes(1);
  });

  test("a deliberate disconnect asks nothing", () => {
    connectRealtime({ accountId: "acct-1" });
    const sock = FakeSocket.last;
    disconnectRealtime();
    sock.dispatch("close");
    expect(requestAppConfigRecheck).not.toHaveBeenCalled();
  });
});
