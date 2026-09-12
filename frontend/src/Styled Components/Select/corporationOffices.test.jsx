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

vi.mock("../../Zustand/usersStore", () => ({
  default: Object.assign((selector) => selector(store), {
    getState: () => store,
  }),
}));

// An id the store does not already hold stands for one still being asked about, so no test here
// reaches for a real lookup.
vi.mock("../../Functions/EveESI/World/locationNameLoader", () => ({
  requestLocationName: () => new Promise(() => {}),
}));

import CorporationOfficesSelect from "./corporationOffices";

const CORPORATION = 98000001;
const JITA = 60003760;
const RAITARU = 1035466617946;
const SOTIYO = 1035466617947;

function open(props = {}) {
  const user = userEvent.setup();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CorporationOfficesSelect
        selectedCorporation={CORPORATION}
        value=""
        onChange={() => {}}
        {...props}
      />
    </QueryClientProvider>,
  );
  return user;
}

beforeEach(() => {
  store.account = {
    characters: [],
    corporations: [
      { corporation_id: CORPORATION, officeLocations: [RAITARU, JITA, SOTIYO] },
    ],
  };
  store.worldData = {
    universeIDs: {
      [JITA]: { id: JITA, name: "Jita IV-4", resolutionStatus: "resolved" },
      // Deliberately sorts after "No Access…" alphabetically: without the unreadable-last rule
      // this office would come out between the two readable ones.
      [RAITARU]: {
        id: RAITARU,
        name: "Zoohen Raitaru",
        resolutionStatus: "resolved",
      },
      [SOTIYO]: {
        id: SOTIYO,
        name: `No Access To Location - ${SOTIYO}`,
        resolutionStatus: "no_access",
      },
    },
    actions: { addUniverseIDs: () => {} },
  };
});

describe("the offices a corporation picker offers", () => {
  // An office no character can dock at is still an office the corporation holds. Left out, it reads
  // as one the corporation does not have; shown, the reader can see what the app could not name.
  it("offers an office nobody can read, saying so, after the named ones", async () => {
    const user = open();

    await user.click(screen.getByRole("combobox"));

    const offices = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(offices).toEqual([
      "Select an office",
      "Jita IV-4",
      "Zoohen Raitaru",
      `No Access To Location - ${SOTIYO}`,
    ]);
  });

  it("lets an office nobody can read be chosen", async () => {
    const chosen = vi.fn();
    const user = open({ onChange: chosen });

    await user.click(screen.getByRole("combobox"));
    await user.click(
      screen.getByRole("option", { name: `No Access To Location - ${SOTIYO}` }),
    );

    expect(chosen).toHaveBeenCalledWith(SOTIYO);
  });

  it("shows the chosen office rather than an empty box", () => {
    open({ value: JITA });

    expect(screen.getByRole("combobox").textContent).toBe("Jita IV-4");
  });

  // MUI warns and renders an empty box for a value with no item behind it, which is what a chosen
  // office whose name has not arrived yet would be.
  it("holds no value while the chosen office is still being named", () => {
    delete store.worldData.universeIDs[JITA];

    open({ value: JITA });

    expect(screen.getByRole("combobox").textContent).toBe("Select an office");
  });
});
