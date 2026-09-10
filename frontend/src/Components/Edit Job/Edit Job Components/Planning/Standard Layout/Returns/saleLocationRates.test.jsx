import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import SaleLocationRates from "./saleLocationRates";
import { SALE_LOCATION_KIND } from "../../../../../../Functions/MarketOrders/saleLocations";

const hub = {
  kind: SALE_LOCATION_KIND.HUB,
  id: "jita",
  name: "Jita",
  priceHubStationID: 60003760,
  brokerFee: null,
};

const structure = {
  kind: SALE_LOCATION_KIND.STRUCTURE,
  id: "placeholder-sale-structure",
  name: "Placeholder Citadel",
  priceHubStationID: 60003760,
  brokerFee: 1.5,
};

const hubRates = {
  brokerFee: {
    kind: SALE_LOCATION_KIND.HUB,
    base: 3,
    rate: 1.35,
    terms: [
      { id: "brokerRelations", label: "Broker Relations", amount: 1.5, level: 5 },
      { id: "faction", label: "Faction standing", amount: 0.15, level: 5 },
      { id: "corporation", label: "Corporation standing", amount: 0, level: 0 },
    ],
  },
  salesTax: { base: 7.5, accounting: 5, rate: 3.375 },
};

const structureRates = {
  brokerFee: { kind: SALE_LOCATION_KIND.STRUCTURE, base: null, rate: 1.5, terms: [] },
  salesTax: { base: 7.5, accounting: 5, rate: 3.375 },
};

describe("the sale location rates block", () => {
  it("shows every subtraction at a station, because they are the seller's own", () => {
    render(<SaleLocationRates saleLocation={hub} rates={hubRates} />);

    expect(screen.getByText("Broker fee, base")).toBeInTheDocument();
    expect(screen.getByText("3.00%")).toBeInTheDocument();
    expect(screen.getByText("−1.50%")).toBeInTheDocument();
    expect(screen.getByText("level 5")).toBeInTheDocument();
    expect(screen.getByText("1.35%")).toBeInTheDocument();
  });

  // A standing of zero is a reduction not earned, which is different from one
  // the app failed to read — so the term stays on screen.
  it("keeps a term that took nothing off", () => {
    render(<SaleLocationRates saleLocation={hub} rates={hubRates} />);

    expect(screen.getByText("Corporation standing")).toBeInTheDocument();
    expect(screen.getByText("no standing with them")).toBeInTheDocument();
  });

  it("shows one line at a citadel and says why there is no working", () => {
    render(<SaleLocationRates saleLocation={structure} rates={structureRates} />);

    expect(screen.getByText("the rate this structure's owner set")).toBeInTheDocument();
    expect(screen.queryByText("Broker fee, base")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Broker Relations does not reduce a structure's fee/),
    ).toBeInTheDocument();
  });

  // Prices from one location, fee from another — the assembly is explicit
  // rather than hidden, because a citadel has no market of its own.
  it("names the hub a citadel's prices came from", () => {
    render(
      <SaleLocationRates
        saleLocation={structure}
        rates={structureRates}
        priceHubName="Jita"
      />,
    );

    expect(
      screen.getByText("Prices from Jita; the fee is this structure's own"),
    ).toBeInTheDocument();
  });

  it("does not claim a hub's prices came from somewhere else", () => {
    render(
      <SaleLocationRates saleLocation={hub} rates={hubRates} priceHubName="Jita" />,
    );

    expect(screen.queryByText(/Prices from/)).not.toBeInTheDocument();
  });

  // Standings are per character, so the same station quotes two characters
  // different fees; the block says whose it is quoting.
  it("names the seller it is quoting", () => {
    render(
      <SaleLocationRates
        saleLocation={hub}
        rates={hubRates}
        seller={{ hash: "trader", name: "Market Alt", isDefault: false }}
      />,
    );

    expect(screen.getByText("Quoted for Market Alt")).toBeInTheDocument();
  });

  // The seller is usually a trading alt rather than whoever builds, so standing
  // in with the main is a guess and has to read as one.
  it("says when the seller is a stand-in rather than a choice", () => {
    render(
      <SaleLocationRates
        saleLocation={hub}
        rates={hubRates}
        seller={{ hash: "main", name: "Main Pilot", isDefault: true }}
      />,
    );

    expect(screen.getByText(/a job cannot yet name one/)).toBeInTheDocument();
  });

  it("says a signed-out seller has no Accounting rather than showing a reduction", () => {
    render(
      <SaleLocationRates
        saleLocation={hub}
        rates={{
          ...hubRates,
          salesTax: { base: 7.5, accounting: 0, rate: 7.5 },
        }}
      />,
    );

    expect(screen.getByText("no Accounting trained")).toBeInTheDocument();
  });

  it("waits rather than quoting a rate it does not have yet", () => {
    render(<SaleLocationRates saleLocation={hub} isLoading />);

    expect(screen.queryByText("Broker fee, base")).not.toBeInTheDocument();
    expect(screen.getByText("Jita")).toBeInTheDocument();
  });

  it("draws nothing without a location", () => {
    const { container } = render(<SaleLocationRates saleLocation={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
