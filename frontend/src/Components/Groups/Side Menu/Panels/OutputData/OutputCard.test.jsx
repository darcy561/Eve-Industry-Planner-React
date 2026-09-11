import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../../../../../tests/routerHarness";

vi.mock("../../../../../Zustand/usersStore", () => {
  const state = () => ({
    jobData: {
      activeGroupID: "group-1",
      actions: { findJobInJobArray: () => undefined },
    },
    applicationSettings: {
      defaultMarketLocation: 60003760,
      defaultOrderType: "sell",
      actions: { getCurrentLocale: () => "en-GB" },
    },
    worldData: { marketData: {} },
  });
  const store = (selector) => selector(state());
  store.getState = state;
  return { default: store };
});

vi.mock("../../../../../Styled Components/IconButton/marketHistory", () => ({
  default: () => null,
}));
vi.mock("../../../../../Styled Components/IconButton/marketData", () => ({
  default: () => null,
}));

const { default: OutputJobCard } = await import("./OutputCard.jsx");

const job = {
  jobID: "job-9",
  itemID: 587,
  name: "Rifter",
  totalQuantityProduced: 10,
  build: { materials: [], costs: {} },
};

function showCard(pageView) {
  return renderWithRouter(
    <OutputJobCard
      inputJob={job}
      state={{ highlightedItems: new Set(), pageView }}
      actions={{ setHighlightedItems: vi.fn() }}
    />,
    ["/editjob/$jobID"],
  );
}

describe("a group's output card", () => {
  it("opens the job as a link carrying the group it was reached from", async () => {
    await showCard();

    expect(screen.getByRole("link", { name: /Rifter/ })).toHaveAttribute(
      "href",
      "/editjob/job-9?activeGroup=group-1",
    );
  });

  // The reader came from a particular view of the group and should land back in
  // it, so the view rides along in the link rather than being set on arrival.
  it("carries the group view the reader is looking at", async () => {
    await showCard("outputs");

    expect(screen.getByRole("link", { name: /Rifter/ })).toHaveAttribute(
      "href",
      "/editjob/job-9?activeGroup=group-1&pageView=outputs",
    );
  });
});
