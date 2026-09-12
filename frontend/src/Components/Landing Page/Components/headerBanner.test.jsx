import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithRouter } from "../../../tests/routerHarness";
import { HeaderBanner } from "./headerBanner";

describe("the landing page banner", () => {
  it("offers the planner as a link a reader can open anywhere", async () => {
    await renderWithRouter(<HeaderBanner />);

    expect(
      screen.getByRole("link", { name: "Give it a try!" }),
    ).toHaveAttribute("href", "/jobplanner");
  });
});
