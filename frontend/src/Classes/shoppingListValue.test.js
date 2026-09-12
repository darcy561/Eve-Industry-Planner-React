import { beforeEach, describe, expect, it } from "vitest";
import ShoppingList from "./shoppingList.js";
import useUsersStore from "../Zustand/usersStore";

const seed = ({ market, marketData }) => {
  useUsersStore.setState((state) => ({
    ...state,
    applicationSettings: {
      ...state.applicationSettings,
      defaultPricing: {
        buying: { market, basis: "sell" },
        selling: { market: "amarr", basis: "buy" },
      },
    },
    worldData: { ...state.worldData, marketData },
  }));
};

const listOf = (typeID, quantity) => {
  const list = new ShoppingList();
  list.items = [
    {
      typeID,
      quantityToPurchase: quantity,
      assetQuantity: 0,
      isVisible: true,
      includeWhenCopying: true,
    },
  ];
  return list;
};

describe("what a shopping list is worth", () => {
  beforeEach(() => {
    useUsersStore.setState((state) => ({
      ...state,
      worldData: { ...state.worldData, marketData: {} },
    }));
  });

  it("totals against the buying side", () => {
    seed({
      market: "jita",
      marketData: { 34: { jita: { sell: 10 }, amarr: { buy: 999 } } },
    });

    const list = listOf(34, 5);
    list.calculateTotalValue();

    expect(list.totalValue).toBe(50);
  });

  // findMarketData builds its empty default from the four hubs, so a market it
  // does not carry misses. Indexing that twice used to raise a TypeError, which
  // took the whole dialogue down rather than pricing one row at nothing.
  it("prices at nothing rather than throwing on a market it has no figures for", () => {
    seed({
      market: "some-player-citadel",
      marketData: { 34: { jita: { sell: 10 } } },
    });

    const list = listOf(34, 5);

    expect(() => list.calculateTotalValue()).not.toThrow();
    expect(list.totalValue).toBe(0);
  });
});
