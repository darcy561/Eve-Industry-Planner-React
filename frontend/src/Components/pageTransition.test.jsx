import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import PageTransition, { usePageKey } from "./pageTransition";

function view(key, body) {
  return <PageTransition contentKey={key}>{body}</PageTransition>;
}

describe("swapping full-page content", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
  });

  // A page being left must unmount at once: holding it through a fade keeps its
  // effects running and its document locks held.
  test("the outgoing content is gone as soon as the key changes", () => {
    const { rerender } = render(view("/a", <div>page a</div>));
    expect(screen.getByText("page a")).toBeTruthy();

    rerender(view("/b", <div>page b</div>));

    expect(screen.queryByText("page a")).toBeNull();
    expect(screen.getByText("page b")).toBeTruthy();
  });

  // Opening a child job from an open one changes a param, not the page; the
  // route keeps its mount rather than tearing down and re-running its setup.
  test("content changing under the same key is not remounted", () => {
    const mounted = vi.fn();
    function Child({ label }) {
      useEffect(() => mounted, []);
      return <div>{label}</div>;
    }

    const { rerender } = render(view("/a", <Child label="first" />));
    rerender(view("/a", <Child label="second" />));

    expect(screen.getByText("second")).toBeTruthy();
    expect(mounted).not.toHaveBeenCalled();
  });

  // Without a hidden frame there is nothing for the fade to animate from, and
  // the page appears with no transition at all.
  test("the incoming content starts hidden, then becomes visible", () => {
    const { rerender } = render(view("/a", <div>page a</div>));
    rerender(view("/b", <div>page b</div>));

    const surface = () => screen.getByText("page b").parentElement;
    expect(surface().style.opacity).toBe("0");

    act(() => vi.advanceTimersByTime(1000));

    expect(surface().style.opacity).toBe("1");
  });
});

const routerState = vi.hoisted(() => ({ current: { matches: [] } }));
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({ select }) => select(routerState.current),
}));

describe("the page key", () => {
  function keyFor(matches, isMaintenanceMode = false) {
    routerState.current = { matches };
    let seen;
    function Probe() {
      seen = usePageKey(isMaintenanceMode);
      return null;
    }
    render(<Probe />);
    return seen;
  }

  // Opening a child job from an open one changes the path but not the page.
  test("is the route pattern, so a param change is not a page change", () => {
    expect(keyFor([{ routeId: "/editjob/$jobID" }])).toBe("/editjob/$jobID");
  });

  test("maintenance overrides the route", () => {
    expect(keyFor([{ routeId: "/dashboard" }], true)).toBe("maintenance");
  });

  test("survives a router state with no matches", () => {
    expect(keyFor([])).toBe("");
  });
});
