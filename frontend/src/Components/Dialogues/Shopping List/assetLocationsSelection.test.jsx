import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const { store } = vi.hoisted(() => ({
  store: {
    account: { characters: [], corporations: [] },
    worldData: { universeIDs: {}, actions: { addUniverseIDs: () => {} } },
  },
}));

vi.mock("../../../Zustand/usersStore", () => ({
  default: Object.assign((selector) => selector(store), {
    getState: () => store,
  }),
}));

import SelectAssetLocation_ShoppingListDialogue from "./assetLocationsSelection";

const JITA = 60003760;
const SOTIYO = 1035466617947;

function open(state = {}) {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SelectAssetLocation_ShoppingListDialogue
        state={{
          assetType: "character",
          selectedCharacter: "main",
          selectedAssetLocation: "",
          assetLocations: [JITA, SOTIYO],
          ...state,
        }}
        actions={{
          setSelectedCharacter: () => {},
          setSelectedAssetLocation: () => {},
        }}
        assetLocationsLoading={false}
        assetLocationsError={false}
      />
    </QueryClientProvider>,
  );
  return user;
}

beforeEach(() => {
  store.account = {
    characters: [{ CharacterHash: "main", CharacterName: "Main" }],
    corporations: [],
  };
  store.worldData = {
    universeIDs: {
      // Sorts after "No Access…" alphabetically, so the order below rests on the unreadable-last
      // rule rather than coinciding with it.
      [JITA]: { id: JITA, name: "Zoohen VII", resolutionStatus: "resolved" },
      [SOTIYO]: {
        id: SOTIYO,
        name: `No Access To Location - ${SOTIYO}`,
        resolutionStatus: "no_access",
      },
    },
    actions: { addUniverseIDs: () => {} },
  };
});

describe("the asset locations a shopping list offers", () => {
  // The assets are in a structure the account cannot name; the reader is told that rather than
  // shown a blank row or nothing at all.
  it("names each location, and says which one it cannot read", async () => {
    const user = open();

    await user.click(screen.getAllByRole("combobox")[1]);

    expect(
      within(screen.getByRole("listbox"))
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Zoohen VII", `No Access To Location - ${SOTIYO}`]);
  });

  it("shows the chosen location rather than an empty box", () => {
    open({ selectedAssetLocation: SOTIYO });

    expect(screen.getAllByRole("combobox")[1].textContent).toBe(
      `No Access To Location - ${SOTIYO}`,
    );
  });
});
