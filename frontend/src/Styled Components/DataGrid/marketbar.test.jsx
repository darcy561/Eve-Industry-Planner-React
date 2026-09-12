import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import MarketDataDisplayGrid from "./marketbar";
import { stubElementHeights } from "../../tests/elementHeights";

const JITA = 60003760;
const JITA_SYSTEM = 30000142;
const SOTIYO = 1035466617946;

const theme = createTheme();

function order(overrides) {
  return {
    order_id: 1,
    is_buy_order: false,
    system_id: JITA_SYSTEM,
    location_id: JITA,
    volume_remain: 10,
    price: 100,
    range: "station",
    ...overrides,
  };
}

function show(marketData, locationNames) {
  return render(
    <ThemeProvider theme={theme}>
      <MarketDataDisplayGrid
        marketData={marketData}
        locationNames={locationNames}
        isLoading={false}
      />
    </ThemeProvider>,
  );
}

let restoreHeights;

beforeEach(() => {
  restoreHeights = stubElementHeights();
});

afterEach(() => restoreHeights?.());

describe("the places a market grid names", () => {
  it("names the system and location from the names it is given", () => {
    show([order({})], {
      [JITA_SYSTEM]: { name: "Jita", resolutionStatus: "resolved" },
      [JITA]: { name: "Jita IV-4", resolutionStatus: "resolved" },
    });

    expect(screen.getByText("Jita")).toBeTruthy();
    expect(screen.getByText("Jita IV-4")).toBeTruthy();
  });

  // The structure carries the name that says nobody could read it, the same as every other surface.
  it("says so when a location could not be named", () => {
    show([order({ location_id: SOTIYO })], {
      [JITA_SYSTEM]: { name: "Jita", resolutionStatus: "resolved" },
      [SOTIYO]: {
        name: `No Access To Location - ${SOTIYO}`,
        resolutionStatus: "no_access",
      },
    });

    expect(screen.getByText(`No Access To Location - ${SOTIYO}`)).toBeTruthy();
  });

  it("falls back when no name reached it at all", () => {
    show([order({})], {});

    expect(screen.getByText("Unknown System")).toBeTruthy();
    expect(screen.getByText("Unknown Location")).toBeTruthy();
  });
});
