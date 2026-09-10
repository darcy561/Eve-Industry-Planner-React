import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import VirtualisedLocationSearch from "./virtualisedLocationSearch";
import { stubElementHeights } from "../../tests/elementHeights";

const theme = createTheme();

/** More places than a dropdown can show at once, which is the ordinary case for a played account. */
const PLACES = Array.from({ length: 400 }, (unused, index) => ({
  locationId: 60000000 + index,
  name: `Station ${index}`,
}));

// jsdom measures every element at zero, which leaves the virtualiser deciding one row is enough.
let restoreHeights;
beforeEach(() => {
  restoreHeights = stubElementHeights();
});
afterEach(() => restoreHeights?.());

function renderSearch(props = {}) {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <VirtualisedLocationSearch
        places={PLACES}
        value={undefined}
        onChange={onChange}
        {...props}
      />
    </ThemeProvider>
  );
  return onChange;
}

describe("picking one of the places an account holds things", () => {
  it("narrows the list by what is typed rather than making it be scrolled", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole("combobox"), "Station 137");

    expect(screen.getByText("Station 137")).toBeTruthy();
    expect(screen.queryByText("Station 12")).toBeNull();
  });

  it("hands back the location that was chosen", async () => {
    const user = userEvent.setup();
    const onChange = renderSearch();

    await user.type(screen.getByRole("combobox"), "Station 137");
    await user.click(screen.getByText("Station 137"));

    expect(onChange).toHaveBeenCalledWith(60000137);
  });

  // Only the rows in view are mounted; four hundred options must not be four hundred nodes.
  it("mounts only what is on screen", async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.click(screen.getByRole("combobox"));

    const shown = document.querySelectorAll('[role="option"]').length;
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(PLACES.length);
  });

  it("shows the place it was given", () => {
    renderSearch({ value: 60000005 });

    expect(screen.getByRole("combobox").value).toBe("Station 5");
  });

  // Holding no location is a choice of its own, so the control reads as that rather than as empty.
  it("reads as the clearing entry while nothing is chosen", () => {
    renderSearch({ anywhereLabel: "Anywhere" });

    expect(screen.getByRole("combobox").value).toBe("Anywhere");
  });

  it("clears the choice when the clearing entry is picked", async () => {
    const user = userEvent.setup();
    const onChange = renderSearch({
      anywhereLabel: "Anywhere",
      value: 60000005,
    });

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Anywhere" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  // A failed lookup must not read as an account holding nothing.
  it("says why there is nothing to choose from", () => {
    renderSearch({ places: [], isError: true });

    expect(
      screen.getByPlaceholderText("Locations unavailable")
    ).toBeTruthy();
  });
});
