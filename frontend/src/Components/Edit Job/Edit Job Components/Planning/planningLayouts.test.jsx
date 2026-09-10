import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * Both layouts mount the same panels.
 *
 * Stage J's whole point was that mobile stops being a reduced version of the
 * stage: it orders the panels differently and the table becomes cards, but a
 * player is not answering fewer questions on a phone. Nothing else checks that,
 * and a panel dropped from one layout is invisible to every per-panel test.
 *
 * The panels themselves are stubbed — this is about which are mounted and that
 * each is handed the stage's props, not about what any of them renders.
 */

const PANELS = [
  ["./Standard Layout/Production Stats Panel/productionStats", "ProductionStats"],
  ["./Standard Layout/Setup Panel/jobSetups", "JobSetupPanel"],
  ["./Standard Layout/Edit Setup Panel/editJobSetup", "EditJobSetup"],
  ["./Standard Layout/Blueprint Options/blueprintPanel", "AvailableBlueprintsPanel"],
  ["./Standard Layout/Skills Panel/SkillsPanel", "SkillsPanel"],
  ["./Standard Layout/Archive Jobs Panel/archiveJobsPanel", "ArchiveJobsPanel"],
];

for (const [path, name] of PANELS) {
  vi.doMock(path, () => ({
    [name]: (props) => <div data-testid={name} data-has-state={!!props.state} />,
    default: (props) => <div data-testid={name} data-has-state={!!props.state} />,
  }));
}

vi.mock("./Standard Layout/Materials And Sourcing/materialsAndSourcingPanel", () => ({
  default: (props) => (
    <div data-testid="MaterialsAndSourcingPanel" data-has-state={!!props.state} />
  ),
}));

vi.mock("./Standard Layout/Cost Breakdown/planningEconomics", () => ({
  default: (props) => (
    <div data-testid="PlanningEconomics" data-has-state={!!props.state} />
  ),
}));

vi.mock("../../../Tutorials/tutorialTemplate", () => ({
  default: () => null,
}));

vi.mock("./tutorialStep1", () => ({ TutorialStep1: () => null }));

const { Planning_StandardLayout_EditJob } = await import(
  "./Standard Layout/standardLayout"
);
const { Planning_MobileLayout_EditJob } = await import(
  "./Mobile Layout/mobileLayout"
);
const { jobFixture } = await import("../../../../tests/jobFixture");

const expected = [
  "ProductionStats",
  "JobSetupPanel",
  "EditJobSetup",
  "AvailableBlueprintsPanel",
  "MaterialsAndSourcingPanel",
  "PlanningEconomics",
  "ArchiveJobsPanel",
  "SkillsPanel",
];

const props = {
  state: { activeJob: jobFixture() },
  actions: { getCurrentParentJobs: () => [] },
};

describe.each([
  ["the standard layout", Planning_StandardLayout_EditJob],
  ["the mobile layout", Planning_MobileLayout_EditJob],
])("%s", (_name, Layout) => {
  it("mounts every panel the stage answers with", () => {
    render(<Layout {...props} />);

    for (const panel of expected) {
      expect(screen.getByTestId(panel)).toBeInTheDocument();
    }
  });

  it("hands each panel the stage's state", () => {
    render(<Layout {...props} />);

    for (const panel of expected) {
      expect(screen.getByTestId(panel)).toHaveAttribute("data-has-state", "true");
    }
  });
});
