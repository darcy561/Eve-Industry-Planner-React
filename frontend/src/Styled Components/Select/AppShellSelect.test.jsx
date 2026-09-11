import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuItem } from "@mui/material";

import AppShellSelect from "./AppShellSelect";

function renderSelect(props = {}) {
  const onChange = vi.fn();
  render(
    <AppShellSelect value="16" onChange={onChange} {...props}>
      <MenuItem value="16">Sixteen</MenuItem>
      <MenuItem value="32">Thirty-two</MenuItem>
    </AppShellSelect>,
  );
  return onChange;
}

describe("the app-shell dropdown", () => {
  // Every call site was reading event.target.value; the shell does it once.
  it("hands back the value rather than the event", async () => {
    const user = userEvent.setup();
    const onChange = renderSelect();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Thirty-two" }));

    expect(onChange).toHaveBeenCalledWith("32");
  });

  it("shows a helper line only when it is given one", () => {
    const { unmount } = render(
      <AppShellSelect value="" onChange={() => {}} helperText="Items Per Page">
        <MenuItem value="">None</MenuItem>
      </AppShellSelect>,
    );
    expect(screen.getByText("Items Per Page")).toBeTruthy();
    unmount();

    renderSelect();
    expect(screen.queryByText("Items Per Page")).toBeNull();
  });

  it("can be given nothing to choose from", async () => {
    const user = userEvent.setup();
    const onChange = renderSelect({ disabled: true });

    await user.click(screen.getByRole("combobox"));

    expect(screen.queryByRole("option")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
