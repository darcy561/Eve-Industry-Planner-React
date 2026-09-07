import { beforeEach, describe, expect, it, vi } from "vitest";

const storeState = {
  account: { accountID: "acct-1" },
  realtimeSync: {
    get activePlanner() {
      return activePlanner;
    },
    actions: {
      getCursorMs: () => 0,
      setCursorMs: () => {},
    },
  },
};
let activePlanner = null;

vi.mock("../src/Zustand/usersStore.js", () => ({
  default: { getState: () => storeState },
}));
const enqueued = [];
vi.mock("../src/Functions/Debounce/inboundJobDocumentsCoalesce.js", () => ({
  enqueueInboundJobDocumentChange: (...args) => enqueued.push(args),
}));

const { applyDocumentMessage } = await import(
  "../src/Realtime/handlers/documentMessage.js"
);

function jobMessage(owner) {
  return {
    collection: "job_documents",
    docID: "job-1",
    owner,
    operationType: "update",
    document: { jobID: "job-1", _meta: { lastModified: "2026-01-01T00:00:00Z" } },
  };
}

// The store holds one planner's jobs, so a document from another would merge
// into them with nothing to tell the two apart.
describe("job documents from a planner the app is not working in", () => {
  beforeEach(() => {
    enqueued.length = 0;
    activePlanner = null;
  });

  it("takes the account's own when no planner has been chosen", async () => {
    await applyDocumentMessage(jobMessage("account:acct-1"));
    expect(enqueued).toHaveLength(1);
  });

  it("ignores another planner's while none has been chosen", async () => {
    await applyDocumentMessage(jobMessage("corporation:98000001"));
    expect(enqueued).toHaveLength(0);
  });

  it("takes the planner it switched to", async () => {
    activePlanner = "corporation:98000001";
    await applyDocumentMessage(jobMessage("corporation:98000001"));
    expect(enqueued).toHaveLength(1);
  });

  // Switching stops the account's own job feed, which is the point of replacing
  // the subscription rather than widening it.
  it("ignores the account's own once it has switched away", async () => {
    activePlanner = "corporation:98000001";
    await applyDocumentMessage(jobMessage("account:acct-1"));
    expect(enqueued).toHaveLength(0);
  });

  // A server that names no owner is one this client cannot place the document
  // for, so it is ignored rather than guessed at.
  it("ignores a document that names no owner", async () => {
    await applyDocumentMessage(jobMessage(undefined));
    expect(enqueued).toHaveLength(0);
  });
});
