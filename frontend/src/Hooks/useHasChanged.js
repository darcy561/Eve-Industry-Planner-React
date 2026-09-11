import { useState } from "react";

/**
 * Whether `value` differs from what it was on the render before.
 *
 * For the case where a component holds a copy of something it was handed — a
 * field seeded from a prop, a panel opened because of what arrived — and the
 * copy has to follow when the original moves. Bringing it into step while
 * rendering rather than in an effect means the first painted frame already
 * carries the right value; an effect runs after the paint, so the frame before
 * it shows the previous one.
 *
 * The caller writes its own update, so that what is being set stays at the call
 * site:
 *
 *     const [shown, setShown] = useState(() => format(rate));
 *     if (useHasChanged(rate)) {
 *       setShown(format(rate));
 *     }
 *
 * Compared with `Object.is`, so pass something stable. A value rebuilt every
 * render — an array from a `map`, an object literal — reads as changed every
 * time; compare what actually identifies it instead, a length or an id.
 *
 * @param {unknown} value
 * @returns {boolean} True on the render where it changed, false on every other.
 */
export function useHasChanged(value) {
  const [seen, setSeen] = useState(value);

  if (!Object.is(value, seen)) {
    setSeen(value);
    return true;
  }

  return false;
}
