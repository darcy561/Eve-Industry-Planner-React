import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FilterChipGroup from "./filterChipGroup";

const OPTIONS = [
  { value: "held", label: "Assets" },
  { value: "deliveries", label: "Deliveries" },
];

function renderGroup(props = {}) {
  const onChange = vi.fn();
  render(
    <FilterChipGroup
      label="Asset view"
      options={OPTIONS}
      value="held"
      onChange={onChange}
      {...props}
    />,
  );
  return onChange;
}

describe("a row of filter chips", () => {
  it("offers every option", () => {
    renderGroup();

    expect(screen.getByText("Assets")).toBeTruthy();
    expect(screen.getByText("Deliveries")).toBeTruthy();
  });

  it("hands back the value that was chosen", async () => {
    const user = userEvent.setup();
    const onChange = renderGroup();

    await user.click(screen.getByText("Deliveries"));

    expect(onChange).toHaveBeenCalledWith("deliveries");
  });

  // A chip is the control, not a label: a reader has to be able to tell which one is on.
  it("says which one is chosen", () => {
    renderGroup();

    const group = screen.getByRole("group", { name: "Asset view" });
    const pressed = [...group.querySelectorAll('[aria-pressed="true"]')];
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toBe("Assets");
  });

  it("keeps a trailing control on the same row", () => {
    renderGroup({ children: <button type="button">Anywhere</button> });

    expect(screen.getByRole("button", { name: "Anywhere" })).toBeTruthy();
  });
});
