import { describe, it, expect, vi, beforeEach } from "vitest";
import { activePlannerStoreState } from "./utils.js";

const storeState = activePlannerStoreState();

vi.mock("../src/Zustand/usersStore.js", () => ({
  default: { getState: () => storeState },
}));
vi.mock("../src/Functions/Endpoints/Private/applyPrivateHeaders.js", () => ({
  getSessionIDFromStore: () => "session-1",
}));
vi.mock("../src/Functions/Endpoints/Private/jobDocuments.js", () => ({
  fetchPlannerJobDocumentsFromApi: vi.fn(),
}));
vi.mock("../src/Functions/App/appVersionCheck.js", () => ({
  considerRemoteAppVersion: vi.fn(),
  isClientAppVersionOutdated: () => false,
}));
vi.mock("../src/Realtime/applyRemoteMessage.js", () => ({ applyRemoteMessage: vi.fn() }));
vi.mock("../src/Events/appConfigEvents.js", () => ({ requestAppConfigRecheck: vi.fn() }));
vi.mock("../src/Realtime/syncAccountDocumentsFromServer.js", () => ({
  syncAccountDocumentsFromServer: vi.fn(),
}));
vi.mock("../src/Realtime/wsClientIdentity.js", () => ({
  clearRealtimeClientID: vi.fn(),
  clearRealtimeClientIdentityHard: vi.fn(),
  getRealtimeClientID: () => null,
  setRealtimeClientID: vi.fn(),
}));

const { sendActivePlanner, restoreActivePlanner } = await import(
  "../src/Realtime/realtimeClient.js"
);

beforeEach(() => {
  storeState.activePlanner.owner = null;
});

// No socket is open in these, so a write cannot be queued. That is the case
// worth pinning: the planner the app reads for must not move to one the
// connection was never told about.
describe("naming the active planner", () => {
  it("holds nothing when the socket did not take the message", () => {
    expect(sendActivePlanner("corporation:98000001")).toBe(false);
    expect(storeState.activePlanner.owner).toBeNull();
  });

  it("names no planner without a handle", () => {
    expect(sendActivePlanner("")).toBe(false);
    expect(storeState.activePlanner.owner).toBeNull();
  });

  // A reconnect re-sends what the client chose, and an account working in its
  // own planner chose nothing — the server already delivers it.
  it("re-sends nothing when no planner was chosen", () => {
    expect(restoreActivePlanner()).toBe(false);
  });
});
