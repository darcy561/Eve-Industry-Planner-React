import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { useHasChanged } from "./useHasChanged.js";

/**
 * What it answers is only true for the render it fires on, and that render is
 * replaced by the one the update causes — so it is read through what a caller
 * does with it rather than by holding the value afterwards.
 */
function Field({ value, onRender }) {
  const [shown, setShown] = useState(() => String(value));
  const changed = useHasChanged(value);
  if (changed) {
    setShown(String(value));
  }
  onRender?.(changed);
  return (
    <button onClick={() => setShown("edited")} data-testid="shown">
      {shown}
    </button>
  );
}

function shown() {
  return screen.getByTestId("shown");
}

describe("useHasChanged", () => {
  it("says nothing changed on the first render", () => {
    const answers = [];
    render(<Field value="a" onRender={(c) => answers.push(c)} />);

    expect(answers).toEqual([false]);
  });

  it("says so once on the render a value changes, then settles", () => {
    const answers = [];
    const { rerender } = render(
      <Field value="a" onRender={(c) => answers.push(c)} />,
    );
    answers.length = 0;

    rerender(<Field value="b" onRender={(c) => answers.push(c)} />);

    expect(answers).toEqual([true, false]);
  });

  it("says nothing changed when the value is handed over again", () => {
    const answers = [];
    const { rerender } = render(
      <Field value="a" onRender={(c) => answers.push(c)} />,
    );
    answers.length = 0;

    rerender(<Field value="a" onRender={(c) => answers.push(c)} />);

    expect(answers).toEqual([false]);
  });

  it("counts a change back to an earlier value", () => {
    const { rerender } = render(<Field value="a" />);
    rerender(<Field value="b" />);
    shown().click();

    rerender(<Field value="a" />);

    expect(shown()).toHaveTextContent("a");
  });

  it("does not count NaN as changing into itself", () => {
    const answers = [];
    const { rerender } = render(
      <Field value={NaN} onRender={(c) => answers.push(c)} />,
    );
    answers.length = 0;

    rerender(<Field value={NaN} onRender={(c) => answers.push(c)} />);

    expect(answers).toEqual([false]);
  });

  it("counts a rebuilt object as changed, identity being what it compares", () => {
    const answers = [];
    const { rerender } = render(
      <Field value={{ a: 1 }} onRender={(c) => answers.push(c)} />,
    );
    answers.length = 0;

    rerender(<Field value={{ a: 1 }} onRender={(c) => answers.push(c)} />);

    expect(answers[0]).toBe(true);
  });
});

describe("a value brought into step with it", () => {
  it("carries the new value on the frame it is handed one", () => {
    const { rerender } = render(<Field value={5} />);

    rerender(<Field value={9} />);

    expect(shown()).toHaveTextContent("9");
  });

  it("leaves a local change alone while the original stays put", () => {
    const { rerender } = render(<Field value={5} />);
    shown().click();

    rerender(<Field value={5} />);

    expect(shown()).toHaveTextContent("edited");
  });

  it("settles rather than adjusting for ever", () => {
    const answers = [];
    const { rerender } = render(
      <Field value={5} onRender={(c) => answers.push(c)} />,
    );
    answers.length = 0;

    rerender(<Field value={9} />);
    rerender(<Field value={9} onRender={(c) => answers.push(c)} />);

    expect(answers).toEqual([false]);
    expect(shown()).toHaveTextContent("9");
  });
});
