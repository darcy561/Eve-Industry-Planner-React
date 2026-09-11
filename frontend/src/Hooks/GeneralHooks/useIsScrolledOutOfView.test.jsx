import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { recordIntersectionObservers } from "../../tests/intersectionObservers.js";
import { useIsScrolledOutOfView } from "./useIsScrolledOutOfView";

let observers = [];

function Subject({ showAnchor = true, threshold }) {
  const [isOutOfView, watchRef] = useIsScrolledOutOfView(threshold);

  return (
    <>
      <p>{isOutOfView ? "out of view" : "in view"}</p>
      {showAnchor && (
        <div ref={watchRef} data-testid="anchor">
          anchor
        </div>
      )}
    </>
  );
}

function answer() {
  return screen.getByText(/view$/).textContent;
}

beforeEach(() => {
  observers = recordIntersectionObservers();
});

describe("watching whether a control has been scrolled off the screen", () => {
  it("starts by saying it is in view", () => {
    render(<Subject />);

    expect(answer()).toBe("in view");
  });

  it("watches the element it is put on", () => {
    render(<Subject />);

    expect(observers).toHaveLength(1);
    expect(observers[0].observed).toEqual([screen.getByTestId("anchor")]);
  });

  it("says it is out of view once it stops intersecting", () => {
    render(<Subject />);

    observers[0].report(false);

    expect(answer()).toBe("out of view");
  });

  it("says it is back in view when it intersects again", () => {
    render(<Subject />);
    observers[0].report(false);

    observers[0].report(true);

    expect(answer()).toBe("in view");
  });

  it("does not watch anything when the element is not drawn", () => {
    render(<Subject showAnchor={false} />);

    expect(observers).toHaveLength(0);
    expect(answer()).toBe("in view");
  });

  it("stops watching when the element goes away", () => {
    const { rerender } = render(<Subject />);

    rerender(<Subject showAnchor={false} />);

    expect(observers[0].disconnected).toBe(true);
  });

  it("watches again when the element comes back", () => {
    const { rerender } = render(<Subject />);
    rerender(<Subject showAnchor={false} />);

    rerender(<Subject />);

    expect(observers).toHaveLength(2);
    expect(observers[1].disconnected).toBe(false);
  });

  it("passes the threshold it was given to the observer", () => {
    render(<Subject threshold={0.5} />);

    expect(observers[0].options).toEqual({ threshold: 0.5 });
  });

  it("asks for a sliver of the element by default", () => {
    render(<Subject />);

    expect(observers[0].options).toEqual({ threshold: 0.15 });
  });
});
