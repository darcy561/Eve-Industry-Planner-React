import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDialogueTrigger } from "./useDialogueTrigger";

function Subject() {
  const dialogue = useDialogueTrigger();

  return (
    <>
      <button onClick={dialogue.open}>open</button>
      <button onClick={dialogue.close}>close</button>
      <p>{dialogue.isOpen ? "open" : "shut"}</p>
      <p data-testid="props">{String(dialogue.dialogueProps.open)}</p>
    </>
  );
}

function state() {
  return screen.getAllByText(/^(open|shut)$/).at(-1).textContent;
}

function press(name) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("holding a dialogue open for the component that owns it", () => {
  it("starts shut", () => {
    render(<Subject />);

    expect(state()).toBe("shut");
  });

  it("opens when asked", () => {
    render(<Subject />);

    press("open");

    expect(state()).toBe("open");
  });

  it("shuts again", () => {
    render(<Subject />);
    press("open");

    press("close");

    expect(state()).toBe("shut");
  });

  it("hands the shell what it needs", () => {
    render(<Subject />);

    press("open");

    expect(screen.getByTestId("props").textContent).toBe("true");
  });
});
