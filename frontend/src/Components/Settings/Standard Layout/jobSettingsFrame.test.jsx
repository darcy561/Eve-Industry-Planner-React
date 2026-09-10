import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const setDefaultMarketCharacter = vi.fn();

vi.mock("../../../Zustand/usersStore", () => {
  const storeState = {
    applicationSettings: {
      defaultMarketLocation: "jita",
      defaultOrderType: "sell",
      defaultStationIDForAssets: 0,
      hideCompleteMaterials: false,
      defaultCitadelBrokersFee: 1,
      defaultMarketCharacter: "trader",
      actions: {
        updateDefaultMarket: vi.fn(),
        updateDefaultOrders: vi.fn(),
        updateDefaultAssetLocation: vi.fn(),
        toggleHideCompleteMaterials: vi.fn(),
        updateCitadelBrokersFee: vi.fn(),
        setDefaultMarketCharacter,
      },
    },
    account: { characters: [], mainCharacterHash: "main" },
  };
  const useUsersStore = (selector) => selector(storeState);
  useUsersStore.getState = () => storeState;
  return { default: useUsersStore };
});

vi.mock("../../../Hooks/EveEsi/useAssetLocations", () => ({
  default: () => ({ locations: [], isLoading: false }),
}));

vi.mock("./Job Settings/customSystemIndexes", () => ({ default: () => null }));
vi.mock("./Job Settings/customExtrasFrame", () => ({ default: () => null }));

const { default: JobSettingsFrame } = await import("./jobSettingsFrame");

// The seller is a separate choice from the builder, and it belongs with the
// other market defaults rather than in a tab of its own.
describe("the default market character", () => {
  it("sits with the market defaults on Job Settings", () => {
    render(<JobSettingsFrame />);

    expect(screen.getByText("Default Market Character")).toBeInTheDocument();
  });
});
