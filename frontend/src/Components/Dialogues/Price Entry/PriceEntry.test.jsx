import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";

vi.mock("./DataProviders", () => ({
  PriceEntryContent: ({ state }) => (
    <div data-testid="price-entry">
      {(state.requestedJobIDs ?? []).join(",")}
    </div>
  ),
}));

const { PriceEntryDialogue } = await import("./PriceEntry.jsx");
const { eventEmitter } = await import("../../../utils/EventSystem");

function openWith(jobIDs) {
  act(() => {
    eventEmitter.emit("priceEntry", { isOpen: true, jobIDs });
  });
}

afterEach(() => {
  eventEmitter.removeAllListeners();
});

describe("the price entry dialogue", () => {
  it("stays shut until something asks for it", () => {
    render(<PriceEntryDialogue />);

    expect(screen.queryByTestId("price-entry")).not.toBeInTheDocument();
  });

  it("opens on the event that asks for it", () => {
    render(<PriceEntryDialogue />);

    openWith(["job-1"]);

    expect(screen.getByTestId("price-entry")).toHaveTextContent("job-1");
  });

  // The dialogue only toggles itself open when it is not already open, and it
  // reads that from the state of the render the event arrived in. Read stale,
  // a second ask would toggle an open dialogue shut.
  it("stays open when asked again while it is already open", () => {
    render(<PriceEntryDialogue />);

    openWith(["job-1"]);
    openWith(["job-1", "job-2"]);

    expect(screen.getByTestId("price-entry")).toHaveTextContent("job-1,job-2");
  });

  it("shuts when the event says it is closed", () => {
    render(<PriceEntryDialogue />);
    openWith(["job-1"]);

    act(() => {
      eventEmitter.emit("priceEntry", { isOpen: false });
    });

    expect(screen.queryByTestId("price-entry")).not.toBeInTheDocument();
  });

  it("opens again after being shut", () => {
    render(<PriceEntryDialogue />);

    openWith(["job-1"]);
    act(() => {
      eventEmitter.emit("priceEntry", { isOpen: false });
    });
    openWith(["job-3"]);

    expect(screen.getByTestId("price-entry")).toHaveTextContent("job-3");
  });
});
