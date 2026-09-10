import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const findMaterialJobInGroup = vi.fn(() => null);
const finaliseCreatedChildJobs = vi.fn();
const useActiveGroupReadOnly = vi.fn(() => false);
const useSiblingLinkLock = vi.fn(() => ({ readOnly: false, reason: "" }));

vi.mock("../../../../../../Functions/Groups/findMaterialJobInGroup", () => ({
  findMaterialJobInGroup: (...args) => findMaterialJobInGroup(...args),
}));

vi.mock("./Helpers/finaliseCreatedChildJobs", () => ({
  finaliseCreatedChildJobs: (...args) => finaliseCreatedChildJobs(...args),
}));

vi.mock("../../../../Edit Job Hooks/useActiveJobDocumentLock", () => ({
  useActiveGroupReadOnly: (...args) => useActiveGroupReadOnly(...args),
  useSiblingLinkLock: (...args) => useSiblingLinkLock(...args),
}));

vi.mock("../../../../../../analytics/trackNewJobsCreated", () => ({
  trackNewJobsCreated: vi.fn(),
}));

const { default: PlanChip } = await import("./planChip");
const { withQueryClient } = await import("../../../../../../tests/utils.js");

const material = { typeID: 34, name: "Tritanium" };
const speculative = { jobID: "spec-34", itemID: 34 };

const state = (overrides = {}) => ({
  activeJob: {
    groupID: "",
    includedInGroup: false,
    build: { childJobs: { 34: [] } },
    ...overrides.activeJob,
  },
  temporaryChildJobs: {},
  parentChildToEdit: { childJobs: {} },
  ...overrides,
});

const renderChip = (props = {}) => {
  const actions = { markChildJobsForRemoval: vi.fn() };
  render(
    withQueryClient(
      <PlanChip
        state={state()}
        actions={actions}
        material={material}
        rowJob={speculative}
        {...props}
      />,
    ),
  );
  return actions;
};

beforeEach(() => {
  vi.clearAllMocks();
  findMaterialJobInGroup.mockReturnValue(null);
  useActiveGroupReadOnly.mockReturnValue(false);
  useSiblingLinkLock.mockReturnValue({ readOnly: false, reason: "" });
});

describe("the plan chip", () => {
  it("reads as Buy until something is committed", () => {
    renderChip();

    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build it" })).toBeEnabled();
  });

  it("promotes the costed job when told to build", async () => {
    renderChip();

    await userEvent.click(screen.getByRole("button", { name: "Build it" }));

    expect(finaliseCreatedChildJobs).toHaveBeenCalledWith(
      expect.objectContaining({ jobsToMarkForAddition: speculative }),
    );
  });

  // Nothing has been costed, so there is no job to promote and no figure behind
  // the decision. The control says why rather than failing on click.
  it("cannot build a row that has not been costed", () => {
    renderChip({ rowJob: null });

    expect(screen.getByRole("button", { name: "Build it" })).toBeDisabled();
  });

  it("reads as Build once a job is marked, and offers the way back", async () => {
    const tempJob = { jobID: "temp-34", itemID: 34 };
    const actions = renderChip({
      state: state({ temporaryChildJobs: { 34: tempJob } }),
    });

    expect(screen.getByText("Build")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Buy instead" }));

    expect(actions.markChildJobsForRemoval).toHaveBeenCalledWith(tempJob);
  });

  // The commonest case there is: a child job linked in an earlier session, no
  // group involved. The chip has to be able to sever that link, not merely
  // report it — a button that reads as live and does nothing is worse than none.
  it("severs a link committed before this session", async () => {
    const linkedJob = { jobID: "linked-34", itemID: 34 };
    const actions = renderChip({
      state: state({ activeJob: { build: { childJobs: { 34: ["linked-34"] } } } }),
      rowJob: linkedJob,
    });

    expect(screen.getByText("Build")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Buy instead" }));

    expect(actions.markChildJobsForRemoval).toHaveBeenCalledWith(linkedJob);
  });

  // Severing a link is the sibling lock's business wherever it happens, which is
  // what the rest of the app gates unlinking on.
  it("gates the way back on the sibling lock, group or not", () => {
    useSiblingLinkLock.mockReturnValue({ readOnly: true, reason: "locked" });

    renderChip({
      state: state({ activeJob: { build: { childJobs: { 34: ["linked-34"] } } } }),
      rowJob: { jobID: "linked-34", itemID: 34 },
    });

    expect(screen.getByRole("button", { name: "Buy instead" })).toBeDisabled();
  });

  it("offers no way back when nothing names the linked job", () => {
    renderChip({
      state: state({ activeJob: { build: { childJobs: { 34: ["linked-34"] } } } }),
      rowJob: null,
    });

    expect(screen.getByRole("button", { name: "Buy instead" })).toBeDisabled();
  });
});

// The panel costs an uncommitted job against the whole requirement because
// committing sizes it to match, so committing has to actually ask for that.
describe("committing a job built for this row", () => {
  it("sizes it to what this row needs", async () => {
    renderChip();
    await userEvent.click(screen.getByRole("button", { name: "Build it" }));

    expect(finaliseCreatedChildJobs).toHaveBeenCalledWith(
      expect.objectContaining({ requiredQuantity: material.quantity }),
    );
  });
});

// A group that already builds the material links its job rather than creating a
// second one that makes the same thing.
describe("the plan chip inside a group", () => {
  const groupJob = { jobID: "group-34", itemID: 34 };
  const inGroup = () =>
    state({ activeJob: { groupID: "g1", includedInGroup: true, build: { childJobs: { 34: [] } } } });

  it("offers to build within the group", () => {
    findMaterialJobInGroup.mockReturnValue(groupJob);

    renderChip({ state: inGroup() });

    expect(
      screen.getByRole("button", { name: "Build in this group" }),
    ).toBeInTheDocument();
  });

  it("links the group's own job rather than the costed one", async () => {
    findMaterialJobInGroup.mockReturnValue(groupJob);

    renderChip({ state: inGroup() });
    await userEvent.click(
      screen.getByRole("button", { name: "Build in this group" }),
    );

    expect(finaliseCreatedChildJobs).toHaveBeenCalledWith(
      expect.objectContaining({ jobsToMarkForAddition: groupJob }),
    );
  });

  // The group's job may already be feeding another job in the group. Sizing it
  // to this row's requirement alone would take that job's supply away without
  // either of them being told.
  it("does not resize a job the group already runs", async () => {
    findMaterialJobInGroup.mockReturnValue(groupJob);

    renderChip({ state: inGroup() });
    await userEvent.click(
      screen.getByRole("button", { name: "Build in this group" }),
    );

    expect(finaliseCreatedChildJobs).toHaveBeenCalledWith(
      expect.objectContaining({ requiredQuantity: undefined }),
    );
  });

  // Linking a sibling and creating a new child are locked separately, and the
  // chip must gate on whichever it would actually do.
  it("gates on the sibling lock when it would link", () => {
    findMaterialJobInGroup.mockReturnValue(groupJob);
    useSiblingLinkLock.mockReturnValue({ readOnly: true, reason: "locked" });

    renderChip({ state: inGroup() });

    expect(
      screen.getByRole("button", { name: "Build in this group" }),
    ).toBeDisabled();
  });

  it("gates on the group lock when it would create", () => {
    useActiveGroupReadOnly.mockReturnValue(true);

    renderChip();

    expect(screen.getByRole("button", { name: "Build it" })).toBeDisabled();
  });
});
