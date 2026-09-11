import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { useCurrentTime } from "./useCurrentTime.js";

const MINUTE = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  vi.spyOn(globalThis, "setInterval");
  vi.spyOn(globalThis, "clearInterval");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function advance(ms) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("useCurrentTime", () => {
  it("reads the clock as soon as it is used", () => {
    const { result } = renderHook(() => useCurrentTime(1000));

    expect(result.current).toBe(Date.now());
  });

  it("advances as time passes", async () => {
    const { result } = renderHook(() => useCurrentTime(1000));
    const started = result.current;

    await advance(5000);

    expect(result.current).toBe(started + 5000);
  });

  it("rounds down to the resolution asked for", async () => {
    const { result } = renderHook(() => useCurrentTime(MINUTE));
    const started = result.current;

    await advance(30_000);

    expect(result.current).toBe(started);

    await advance(30_000);

    expect(result.current).toBe(started + MINUTE);
  });

  it("does not re-render a reader between its own steps", async () => {
    let renders = 0;
    function Probe() {
      renders += 1;
      useCurrentTime(MINUTE);
      return null;
    }
    render(<Probe />);
    const afterMount = renders;

    await advance(59_000);
    expect(renders).toBe(afterMount);

    await advance(1000);
    expect(renders).toBe(afterMount + 1);
  });

  it("runs one interval however many readers there are", () => {
    function Probe() {
      useCurrentTime();
      return null;
    }
    render(
      <>
        <Probe />
        <Probe />
        <Probe />
      </>,
    );

    expect(setInterval).toHaveBeenCalledTimes(1);
  });

  it("stops the interval once the last reader goes", () => {
    const first = renderHook(() => useCurrentTime());
    const second = renderHook(() => useCurrentTime());

    first.unmount();
    expect(clearInterval).not.toHaveBeenCalled();

    second.unmount();
    expect(clearInterval).toHaveBeenCalledTimes(1);
  });

  it("starts again after everything has unmounted", async () => {
    const { unmount } = renderHook(() => useCurrentTime(1000));
    unmount();

    const { result } = renderHook(() => useCurrentTime(1000));
    const restarted = result.current;

    await advance(2000);

    expect(result.current).toBe(restarted + 2000);
  });

  it("reads the clock afresh after a spell with no readers at all", async () => {
    const { unmount } = renderHook(() => useCurrentTime(1000));
    unmount();

    // Nothing is subscribed, so the interval is stopped and the time the store
    // last saw goes stale while the clock keeps moving.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
    });

    const { result } = renderHook(() => useCurrentTime(1000));

    expect(result.current).toBe(Date.now());
  });

  it("gives readers at different resolutions their own view of the clock", async () => {
    const fine = renderHook(() => useCurrentTime(1000));
    const coarse = renderHook(() => useCurrentTime(MINUTE));
    const startedCoarse = coarse.result.current;

    await advance(5000);

    expect(fine.result.current).toBe(startedCoarse + 5000);
    expect(coarse.result.current).toBe(startedCoarse);
  });
});
