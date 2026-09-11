import { useSyncExternalStore } from "react";

const TICK_MS = 1000;
const MINUTE_MS = 60_000;

const listeners = new Set();
let intervalID = null;
let now = Date.now();

function tick() {
  now = Date.now();
  for (const listener of listeners) listener();
}

/**
 * One interval serves every reader, however many are mounted, and stops once
 * the last of them unmounts.
 */
function subscribe(listener) {
  listeners.add(listener);
  if (intervalID === null) {
    now = Date.now();
    intervalID = setInterval(tick, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalID !== null) {
      clearInterval(intervalID);
      intervalID = null;
    }
  };
}

/**
 * The current time, kept current, for a figure that would otherwise be stuck at
 * whatever the clock said on the last render — a countdown, or a job that has
 * since finished.
 *
 * The time is rounded down to `granularityMs`, and a reader only re-renders
 * when its own rounded value changes. A countdown showing whole minutes asks
 * for the default and re-renders once a minute, not once a second.
 *
 * @param {number} [granularityMs=60000] Resolution the caller needs.
 * @returns {number} Milliseconds since the epoch, rounded down.
 */
export function useCurrentTime(granularityMs = MINUTE_MS) {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(now / granularityMs) * granularityMs,
  );
}
