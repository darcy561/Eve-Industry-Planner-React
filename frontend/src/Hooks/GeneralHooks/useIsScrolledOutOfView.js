import { useCallback, useState } from "react";

/**
 * Watches an element and reports whether it has been scrolled out of view, for a
 * floating stand-in that should only appear once the real control has left the
 * screen.
 *
 * The returned ref attaches the observer as the element mounts and disconnects it
 * as the element leaves, so a control that moves between steps or panels is
 * re-observed without a dependency list to keep in step.
 *
 * @param {number} [threshold=0.15] - Fraction of the element that must be visible to count as in view.
 * @returns {[boolean, function(Element): (function(): void)]} Whether it is out of view, and the ref to place on it.
 */
export function useIsScrolledOutOfView(threshold = 0.15) {
  const [isOutOfView, setIsOutOfView] = useState(false);

  const watchRef = useCallback(
    (element) => {
      const observer = new IntersectionObserver(
        ([entry]) => setIsOutOfView(!entry.isIntersecting),
        { threshold },
      );

      observer.observe(element);
      return () => observer.disconnect();
    },
    [threshold],
  );

  return [isOutOfView, watchRef];
}
