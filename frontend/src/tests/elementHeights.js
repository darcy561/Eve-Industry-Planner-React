/**
 * Gives rendered elements a size in jsdom, which measures everything as zero.
 *
 * A virtualised list asks the browser how tall its rows turned out and mounts only what fits the
 * viewport. With every measurement zero it decides one row is enough — or, when the scroller itself
 * measures zero, that no row is visible at all — so a test asserting on the rows sees nothing.
 *
 * Both measurements are stubbed because the two virtualisers ask differently: rows are measured
 * with `getBoundingClientRect`, while the scroll element's own size is read from `offsetHeight`.
 *
 * Call from `beforeEach` and call what it returns from `afterEach`: it replaces prototype members
 * outright, so nothing restores them on the caller's behalf and a file that forgets leaves every
 * test after it measuring the same size.
 *
 * @param {number} [height] - pixels to report for every element
 * @param {number} [width]
 * @returns {() => void} restores the real measurements
 */
export function stubElementHeights(height = 40, width = 1024) {
  const originalRect = Element.prototype.getBoundingClientRect;
  const originalHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetHeight",
  );
  const originalWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth",
  );

  Element.prototype.getBoundingClientRect = function stubbed() {
    const rect = originalRect.call(this);
    return {
      ...rect,
      height,
      width: rect.width || width,
      bottom: rect.top + height,
      toJSON: () => rect,
    };
  };

  // A scroller is as tall as its own box; a row is one row tall.
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return height;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return width;
    },
  });

  return () => {
    Element.prototype.getBoundingClientRect = originalRect;
    restore("offsetHeight", originalHeight);
    restore("offsetWidth", originalWidth);
  };
}

function restore(name, descriptor) {
  if (descriptor) {
    Object.defineProperty(HTMLElement.prototype, name, descriptor);
  } else {
    delete HTMLElement.prototype[name];
  }
}
