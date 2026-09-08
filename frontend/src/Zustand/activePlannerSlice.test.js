import { create } from "zustand";
import { describe, expect, it } from "vitest";
import activePlannerSlice from "./activePlannerSlice.js";

function storeWithAccount(accountID) {
  return create((set, get) => ({
    account: { accountID },
    ...activePlannerSlice(set, get),
  }));
}

describe("the planner the app works in", () => {
  it("is the account's own until one is named", () => {
    const store = storeWithAccount("acct-1");

    expect(store.getState().activePlanner.owner).toBeNull();
    expect(
      store.getState().activePlanner.actions.getActivePlannerOwner()
    ).toBe("account:acct-1");
  });

  it("is the named planner once one is set", () => {
    const store = storeWithAccount("acct-1");

    store.getState().activePlanner.actions.setActivePlannerOwner(
      "corporation:98000001"
    );

    expect(
      store.getState().activePlanner.actions.getActivePlannerOwner()
    ).toBe("corporation:98000001");
  });

  it("falls back to the account's own when the name is dropped", () => {
    const store = storeWithAccount("acct-1");
    const { setActivePlannerOwner, getActivePlannerOwner } =
      store.getState().activePlanner.actions;

    setActivePlannerOwner("corporation:98000001");
    setActivePlannerOwner(null);

    expect(getActivePlannerOwner()).toBe("account:acct-1");
  });

  // The header is left off a signed-out request, and a query key carries no
  // owner, rather than either naming a planner nobody is in.
  it("names no planner when nobody is signed in", () => {
    const store = storeWithAccount("");

    expect(
      store.getState().activePlanner.actions.getActivePlannerOwner()
    ).toBeNull();
  });

  it("keeps the same state object when the planner does not change", () => {
    const store = storeWithAccount("acct-1");
    store.getState().activePlanner.actions.setActivePlannerOwner("corporation:1");
    const before = store.getState().activePlanner;

    store.getState().activePlanner.actions.setActivePlannerOwner("corporation:1");

    expect(store.getState().activePlanner).toBe(before);
  });

  it("is dropped by a sign-out", () => {
    const store = storeWithAccount("acct-1");
    const { setActivePlannerOwner, resetActivePlannerStore } =
      store.getState().activePlanner.actions;

    setActivePlannerOwner("corporation:98000001");
    resetActivePlannerStore();

    expect(store.getState().activePlanner.owner).toBeNull();
  });
});
