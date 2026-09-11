import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Replaces the global `IntersectionObserver` — which `setup.js` stubs with an inert
 * one — with a recording stub, so a test can see what was watched and say what the
 * browser can see.
 *
 * @returns {Array<Object>} The observers created since the call, in creation order.
 * Each carries `options`, the `observed` elements, whether it was `disconnected`,
 * and `report(isIntersecting)` to drive its callback.
 */
export function recordIntersectionObservers() {
  const observers = [];

  class RecordingObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(element) {
      this.observed.push(element);
    }
    unobserve() {}
    disconnect() {
      this.disconnected = true;
    }
    takeRecords() {
      return [];
    }
    report(isIntersecting) {
      act(() => this.callback([{ isIntersecting }]));
    }
  }

  vi.stubGlobal("IntersectionObserver", RecordingObserver);
  return observers;
}

/**
 * Finds the observer watching an element, so a test with more than one in flight
 * does not have to rely on the order they were created in.
 *
 * @param {Array<Object>} observers - From `recordIntersectionObservers`.
 * @param {Element} element
 * @returns {Object|undefined}
 */
export function observerWatching(observers, element) {
  return observers.find((observer) => observer.observed.includes(element));
}
