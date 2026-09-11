import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock environment variables - Vitest handles this automatically
// No need to manually set process.env in Vitest

vi.stubGlobal(
  "matchMedia",
  vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);

// Declared as a class because MUI calls these with `new`, which a plain mock does not satisfy.
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("ResizeObserver", MockObserver);
vi.stubGlobal("IntersectionObserver", MockObserver);

/**
 * What React says when a component hands the DOM something it cannot use.
 *
 * Not a list of components or of props — those would be a guess at a library's
 * API, and would go stale the next time it changed. React validates every
 * attribute it is asked to set, and these are the shapes it complains in.
 */
const BROKEN_DOM_CONTRACT = [
  /does not recognize the .* prop on a DOM element/,
  /Invalid DOM property/,
  /for a non-boolean attribute/,
  /Invalid value for prop/,
  /Unknown event handler property/,
  /cannot appear as a (child|descendant) of/,
];

/**
 * Turns React's DOM warnings into test failures.
 *
 * These fail in the one direction nothing else catches: the prop is not
 * consumed, so it lands on the node as an unknown attribute and whatever it
 * asked for never happens. Nothing throws and no assertion notices — MUI v9
 * stopped taking layout as props, and nine `Stack`s across the app quietly
 * stopped laying out, with the warning sitting in this suite's own output the
 * whole time.
 *
 * Wrapped once, here, rather than per test: a spy installed in a `beforeEach`
 * closes over the previous test's spy, and by the hundredth file the chain is
 * deep enough to overflow the stack. A test that wants to assert on
 * `console.error` still replaces this freely, and restoring puts it back.
 */
const reportError = console.error;

console.error = (...args) => {
  const text = args
    .map((arg) => (typeof arg === "string" ? arg : ""))
    .join(" ");

  if (BROKEN_DOM_CONTRACT.some((shape) => shape.test(text))) {
    throw new Error(
      `React rejected what a component gave the DOM:\n${text}\n\n` +
        "The attribute is dropped, so whatever it asked for is not applied.",
    );
  }

  reportError(...args);
};
