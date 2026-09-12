import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithRouter } from "../tests/routerHarness";
import { startLogin } from "../Functions/Auth/loginProgress";
import { emitLoginComplete } from "../Events/loginEvents";
import { RoutePending } from "./routePending";

vi.mock("./Auth/LoginUI/LoginUI", () => ({
  UserLogInUI: () => <div>Signing you in</div>,
}));

vi.mock("./loadingPage", () => ({
  LoadingPage: ({ variant }) => <div>Route splash: {variant}</div>,
}));

afterEach(() => {
  emitLoginComplete();
});

describe("what a reader looks at while the router waits", () => {
  it("shows the route splash when nothing is signing in", async () => {
    emitLoginComplete();

    await renderWithRouter(<RoutePending />);

    expect(screen.getByText(/Route splash/)).toBeVisible();
  });

  // A resume holds the same pending state as a chunk downloading, and the two are a
  // different wait — one is worth watching step by step.
  it("shows login progress while a session is being rebuilt", async () => {
    startLogin();

    await renderWithRouter(<RoutePending />);

    expect(screen.getByText("Signing you in")).toBeVisible();
  });

  // The first step is a network round trip away from the start, so inferring from what
  // has completed would show the wrong screen for the whole opening phase.
  it("shows it from the first moment, before any step has reported", async () => {
    startLogin();

    await renderWithRouter(<RoutePending />);

    expect(screen.queryByText(/Route splash/)).toBeNull();
  });

  // The router holds this screen for a minimum, and that hold is over the screen
  // rather than what is inside it: swapping the moment the last step landed would take
  // the steps off the reader mid-read.
  it("keeps the progress up when the login finishes under it", async () => {
    startLogin();
    await renderWithRouter(<RoutePending />);

    // The store tells the screen directly, so this is the moment the old code swapped.
    await act(async () => {
      emitLoginComplete();
    });

    expect(screen.getByText("Signing you in")).toBeVisible();
    expect(screen.queryByText(/Route splash/)).toBeNull();
  });

  // The next wait is its own: a route chunk downloading is a moment, not a login.
  it("is the splash again on the next wait", async () => {
    startLogin();
    const first = await renderWithRouter(<RoutePending />);
    emitLoginComplete();
    first.unmount();

    await renderWithRouter(<RoutePending />);

    expect(screen.getByText(/Route splash/)).toBeVisible();
  });
});
