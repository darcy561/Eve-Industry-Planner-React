import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { timeline } = vi.hoisted(() => ({ timeline: { current: {} } }));

vi.mock("./useArchiveTimeline", () => ({
  useArchiveTimeline: () => timeline.current,
}));

const { RecalculationNotice } = await import("./RecalculationNotice.jsx");

function showing(recalculation) {
  timeline.current = { recalculation };
  return <RecalculationNotice />;
}

describe("what the recalculation notice says", () => {
  it("says the figures are being rebuilt", () => {
    render(showing("recalculating"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your statistics are being rebuilt",
    );
  });

  it("says a rebuild could not be finished", () => {
    render(showing("failed"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "could not be completed",
    );
  });

  it("says nothing when there is nothing to report", () => {
    render(showing(null));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // The alert slides shut rather than vanishing, so it is on screen for the
  // length of that transition after the state it describes has gone. It has to
  // keep its words for as long as it is still being read.
  it("still reads while it is collapsing away", () => {
    const { rerender } = render(showing("recalculating"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your statistics are being rebuilt",
    );

    rerender(showing(null));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your statistics are being rebuilt",
    );
  });

  it("takes up the new wording when the state changes to another", () => {
    const { rerender } = render(showing("recalculating"));

    rerender(showing("failed"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "could not be completed",
    );
  });

  it("keeps the last wording it had, not the first", () => {
    const { rerender } = render(showing("recalculating"));
    rerender(showing("failed"));

    rerender(showing(null));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "could not be completed",
    );
  });
});
