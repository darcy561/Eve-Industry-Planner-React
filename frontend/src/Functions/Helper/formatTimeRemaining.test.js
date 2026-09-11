import { afterEach, describe, expect, it, vi } from "vitest";
import { formatTimeRemaining } from "./numberParser.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

afterEach(() => {
  vi.useRealTimers();
});

describe("formatTimeRemaining", () => {
  describe("measuring from a time the caller holds", () => {
    it("counts down from the instant it is given", () => {
      const now = Date.parse("2026-01-01T00:00:00.000Z");

      expect(formatTimeRemaining(now + 2 * HOUR, { now })).toBe("2H");
    });

    it("reads as complete once that instant is past the deadline", () => {
      const deadline = Date.parse("2026-01-01T00:00:00.000Z");

      expect(formatTimeRemaining(deadline, { now: deadline + 1 })).toBe(
        "Complete",
      );
    });

    it("is still counting down a moment before the deadline", () => {
      const deadline = Date.parse("2026-01-01T00:00:00.000Z");

      expect(formatTimeRemaining(deadline, { now: deadline - MINUTE })).toBe(
        "1M",
      );
    });

    it("does not pass the instant on to the duration formatter", () => {
      const now = Date.parse("2026-01-01T00:00:00.000Z");

      // A stray `now` reaching formatTimeDuration would read as an unknown
      // unit toggle and change which parts are shown.
      expect(formatTimeRemaining(now + HOUR + MINUTE, { now })).toBe("1H 1M");
    });

    it("still honours the formatting options beside it", () => {
      const now = Date.parse("2026-01-01T00:00:00.000Z");

      expect(
        formatTimeRemaining(now + MINUTE + 30_000, { now, seconds: true }),
      ).toBe("1M 30S");
    });
  });

  describe("without one", () => {
    it("falls back to the current time", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

      expect(formatTimeRemaining(Date.now() + 3 * HOUR)).toBe("3H");
    });

    it("reads as complete for a deadline already past", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

      expect(formatTimeRemaining(Date.now() - 1)).toBe("Complete");
    });
  });

  it("rejects a time it cannot read", () => {
    expect(formatTimeRemaining(NaN)).toBe("Invalid input time");
  });
});
