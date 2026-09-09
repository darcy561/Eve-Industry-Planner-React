import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock environment variables - Vitest handles this automatically
// No need to manually set process.env in Vitest

vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
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

vi.stubGlobal('ResizeObserver', MockObserver);
vi.stubGlobal('IntersectionObserver', MockObserver);
