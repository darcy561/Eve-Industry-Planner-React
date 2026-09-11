import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "../../tests/routerHarness";
import {
  RouterButton,
  RouterCardActionArea,
  RouterListItemButton,
  whenFollowed,
} from "./routerControls";

const controls = [
  ["RouterButton", RouterButton],
  ["RouterListItemButton", RouterListItemButton],
  ["RouterCardActionArea", RouterCardActionArea],
];

describe.each(controls)("%s", (name, Control) => {
  it("renders an anchor carrying the route it points at", async () => {
    await renderWithRouter(<Control to="/jobplanner">Planner</Control>, [
      "/jobplanner",
    ]);

    const link = screen.getByRole("link", { name: "Planner" });
    expect(link).toHaveAttribute("href", "/jobplanner");
  });

  it("builds the href from params and search rather than a written path", async () => {
    await renderWithRouter(
      <Control
        to="/editjob/$jobID"
        params={{ jobID: "abc" }}
        search={{ activeGroup: "g1" }}
      >
        Job
      </Control>,
      ["/editjob/$jobID"],
    );

    expect(screen.getByRole("link", { name: "Job" })).toHaveAttribute(
      "href",
      "/editjob/abc?activeGroup=g1",
    );
  });

  it("navigates in place instead of leaving the page", async () => {
    await renderWithRouter(<Control to="/jobplanner">Planner</Control>, [
      "/jobplanner",
    ]);

    await userEvent.click(screen.getByRole("link", { name: "Planner" }));

    expect(screen.queryByRole("link", { name: "Planner" })).toBeNull();
    expect(window.location.pathname).toBe("/");
  });

  it("keeps the MUI props the control is used with", async () => {
    await renderWithRouter(
      <Control to="/jobplanner" color="secondary" aria-label="Planner">
        Planner
      </Control>,
      ["/jobplanner"],
    );

    expect(screen.getByRole("link", { name: "Planner" })).toHaveClass(
      "MuiButtonBase-root",
    );
  });

  // A disabled link has nothing to point at, so announcing one is a lie the
  // router's own disabled handling would otherwise tell.
  it("is no longer a link once disabled", async () => {
    await renderWithRouter(
      <Control to="/jobplanner" disabled aria-label="Planner">
        Planner
      </Control>,
      ["/jobplanner"],
    );

    const control = screen.getByLabelText("Planner");
    expect(control).toHaveClass("Mui-disabled");
    expect(control).not.toHaveAttribute("role", "link");
    expect(control).not.toHaveAttribute("href");
    expect(control).not.toHaveAttribute("to");
  });
});

describe("whenFollowed", () => {
  it("runs for a plain left click", () => {
    const after = vi.fn();

    whenFollowed(after)({ button: 0 });

    expect(after).toHaveBeenCalled();
  });

  // These are the clicks the router hands back to the browser, so the reader is
  // still on the page they clicked from and whatever the handler dismisses
  // should stay put.
  it.each([
    ["ctrl", { button: 0, ctrlKey: true }],
    ["meta", { button: 0, metaKey: true }],
    ["shift", { button: 0, shiftKey: true }],
    ["alt", { button: 0, altKey: true }],
    ["middle", { button: 1 }],
  ])("does not run for a %s click", (_name, event) => {
    const after = vi.fn();

    whenFollowed(after)(event);

    expect(after).not.toHaveBeenCalled();
  });
});
