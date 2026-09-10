/**
 * Gives rendered elements a height in jsdom, which measures everything as zero.
 *
 * A virtualised list asks the browser how tall its rows turned out and mounts only what fits the
 * viewport. With every measurement zero it decides one row is enough, so a test asserting on the
 * rows below the first sees nothing.
 *
 * Call from `beforeEach` and call what it returns from `afterEach`: it replaces a prototype method
 * outright, so nothing restores it on the caller's behalf and a file that forgets leaves every test
 * after it measuring the same height.
 *
 * @param {number} [height] - pixels to report for every element
 * @returns {() => void} restores the real measurement
 */
export function stubElementHeights(height = 40) {
  const original = Element.prototype.getBoundingClientRect;

  Element.prototype.getBoundingClientRect = function stubbed() {
    const rect = original.call(this);
    return {
      ...rect,
      height,
      width: rect.width || 1024,
      bottom: rect.top + height,
      toJSON: () => rect,
    };
  };

  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}
