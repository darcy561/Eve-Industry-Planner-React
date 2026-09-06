import { beforeEach, describe, expect, it, vi } from "vitest";

// The recalculating user's settings: a different structure, a different default
// ME and a different main character from the ones the job below was built with.
const RECALCULATING_USER = {
  customStructureID: "manufacturing-theirs",
  structureID: 35827,
  rigID: 37158,
  systemTypeID: 30000142,
  systemID: 30000142,
  taxValue: 0.1,
  mainCharacter: "hash-of-the-recalculating-user",
  defaultME: 5,
};

// The job's own build context, as stored on its setup.
const JOB_AS_BUILT = {
  customStructureID: "manufacturing-the-jobs-own",
  structureID: 35825,
  rigID: 37155,
  systemTypeID: 30002187,
  systemID: 30002187,
  taxValue: 0.25,
  character: "hash-of-whoever-built-the-job",
  ME: 10,
  TE: 20,
};

vi.mock("../src/Zustand/usersStore", () => ({
  default: {
    getState: () => ({
      account: {
        isLoggedIn: true,
        actions: {
          getMainCharacterHash: () => RECALCULATING_USER.mainCharacter,
          getMainCharacter: () => ({ CharacterHash: RECALCULATING_USER.mainCharacter }),
          findCharacterByHash: (hash) => ({ CharacterHash: hash }),
        },
      },
      worldData: {
        marketData: {},
        systemIndexes: {},
        universeIDs: {},
        actions: {
          findSystemIndex: () => null,
          findMarketData: () => null,
          addSystemIndex: () => {},
          addMarketData: () => {},
        },
      },
      applicationSettings: {
        defaultMaterialEfficiencyValue: RECALCULATING_USER.defaultME,
        defaultCitadelBrokersFee: 0,
        actions: {
          getDefaultCustomStructureWithJobType: () => ({
            id: RECALCULATING_USER.customStructureID,
            structureType: RECALCULATING_USER.structureID,
            rigType: RECALCULATING_USER.rigID,
            systemType: RECALCULATING_USER.systemTypeID,
            systemID: RECALCULATING_USER.systemID,
            tax: RECALCULATING_USER.taxValue,
          }),
          // Only the recalculating user's own structure resolves. The job's is
          // absent from their settings, which is exactly a member opening
          // another's job — and what makes stamping their id onto it a defect.
          findPredefinedSystemIndex: () => null,
          getCustomStructureWithID: (id) =>
            id === RECALCULATING_USER.customStructureID
              ? { id, tax: RECALCULATING_USER.taxValue }
              : null,
        },
      },
    }),
  },
}));

// The blueprint cache the recalculating user holds: none, which is what makes the
// derived ME fall back to their own default rather than the job's stored value.
vi.mock("../src/Hooks/EveEsi/Character/useGetAllCharacterBlueprints", () => ({
  getAllCachedCharacterBlueprints: () => ({ data: {}, isLoading: false, isError: false }),
}));

vi.mock("../src/Hooks/EveEsi/Corporation/useGetAllCorporationBlueprints", () => ({
  getAllCachedCorporationBlueprints: () => ({ data: {}, isLoading: false, isError: false }),
}));

const { default: recalculateJobForNewTotal } = await import(
  "../src/Functions/JobPlanner/recalculateJobForNewTotal"
);
const { default: Setup } = await import("../src/Classes/jobSetup");

/** A job with one setup, built in a structure the recalculating user does not own. */
function jobBuiltByAnotherMember({ maxProductionLimit = 10, perRun = 1 } = {}) {
  const setup = new Setup({
    runCount: 5,
    jobCount: 1,
    ME: JOB_AS_BUILT.ME,
    TE: JOB_AS_BUILT.TE,
    structureID: JOB_AS_BUILT.structureID,
    rigID: JOB_AS_BUILT.rigID,
    systemTypeID: JOB_AS_BUILT.systemTypeID,
    systemID: JOB_AS_BUILT.systemID,
    taxValue: JOB_AS_BUILT.taxValue,
    customStructureID: JOB_AS_BUILT.customStructureID,
    characterToUse: JOB_AS_BUILT.character,
    jobType: 1,
  });

  return {
    jobType: 1,
    blueprintTypeID: 1234,
    maxProductionLimit,
    skills: [],
    rawData: { products: [{ quantity: perRun }], materials: [], time: 100 },
    build: { setup: { [setup.id]: setup } },
    layout: { setupToEdit: setup.id },
  };
}

// A query client that holds nothing: the figures a setup derives from skills and
// prices are not what these tests are about, and an empty cache exercises the same
// paths the app takes before those queries resolve.
function emptyQueryClient() {
  return {
    getQueryState: () => undefined,
    getQueryData: () => undefined,
  };
}

function onlySetup(job) {
  const setups = Object.values(job.build.setup);
  expect(setups).toHaveLength(1);
  return setups[0];
}

describe("recalculating a job's setups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Characterisation: this is what the code does today. Every assertion marked
  // "as built" is the behaviour the fix changes, and this test is expected to
  // fail on those lines once it lands.
  it("today: rebuilds the build context from the recalculating user's settings", () => {
    const job = jobBuiltByAnotherMember();

    recalculateJobForNewTotal(job, 5, emptyQueryClient());

    const setup = onlySetup(job);
    expect(setup.customStructureID).toBe(RECALCULATING_USER.customStructureID);
    expect(setup.structureID).toBe(RECALCULATING_USER.structureID);
    expect(setup.rigID).toBe(RECALCULATING_USER.rigID);
    expect(setup.systemID).toBe(RECALCULATING_USER.systemID);
    expect(setup.taxValue).toBe(RECALCULATING_USER.taxValue);
    expect(setup.selectedCharacter).toBe(RECALCULATING_USER.mainCharacter);
    expect(setup.ME).toBe(RECALCULATING_USER.defaultME);
  });

  // The layout is the part recalculation is for, and it is correct today: a new
  // quantity produces a new split. Nothing about the fix may change this.
  it("splits a new quantity across setups by the job's max run limit", () => {
    const job = jobBuiltByAnotherMember({ maxProductionLimit: 10, perRun: 1 });

    recalculateJobForNewTotal(job, 25, emptyQueryClient());

    const setups = Object.values(job.build.setup);
    const totalRuns = setups.reduce((sum, s) => sum + s.runCount * s.jobCount, 0);
    expect(totalRuns).toBe(25);
    expect(setups.length).toBeGreaterThan(1);
  });

  it("points the editor at the first setup of the new layout", () => {
    const job = jobBuiltByAnotherMember();

    recalculateJobForNewTotal(job, 25, emptyQueryClient());

    expect(job.layout.setupToEdit).toBe(Object.keys(job.build.setup)[0]);
  });

  // The group template path: buildJob restores setups from a saved template, then
  // recalculates if the quantity differs. Today that discards what the template
  // just restored, so a saved template silently does not apply — no sharing
  // involved, and no second member.
  it("today: discards a restored template's context when the quantity differs", () => {
    const job = jobBuiltByAnotherMember({ maxProductionLimit: 10, perRun: 1 });
    const restored = onlySetup(job);
    expect(restored.customStructureID).toBe(JOB_AS_BUILT.customStructureID);

    recalculateJobForNewTotal(job, 7, emptyQueryClient());

    expect(onlySetup(job).customStructureID).toBe(
      RECALCULATING_USER.customStructureID
    );
  });

  // A quantity that needs more setups than the job has: whatever the fix does
  // about context, every setup in the new layout has to be given one.
  it("gives every setup in a larger layout the same build context", () => {
    const job = jobBuiltByAnotherMember({ maxProductionLimit: 10, perRun: 1 });

    recalculateJobForNewTotal(job, 25, emptyQueryClient());

    const setups = Object.values(job.build.setup);
    expect(setups.length).toBeGreaterThan(1);
    const contexts = new Set(
      setups.map((setup) =>
        [setup.customStructureID, setup.structureID, setup.ME, setup.selectedCharacter].join("|")
      )
    );
    expect(contexts.size).toBe(1);
  });

  // The alternative system index is a per-setup override a user set deliberately,
  // and it is lost with everything else today.
  it("today: drops a setup's alternative system index override", () => {
    const job = jobBuiltByAnotherMember();
    const setup = onlySetup(job);
    setup.useAlternativeSystemIndexValue = true;
    setup.alternativeSystemIndexValue = 0.042;

    recalculateJobForNewTotal(job, 5, emptyQueryClient());

    expect(onlySetup(job).useAlternativeSystemIndexValue).toBe(false);
  });

  it("does nothing without a job or a quantity", () => {
    const job = jobBuiltByAnotherMember();
    const before = Object.keys(job.build.setup);

    recalculateJobForNewTotal(job, 0, emptyQueryClient());
    recalculateJobForNewTotal(null, 5, emptyQueryClient());

    expect(Object.keys(job.build.setup)).toEqual(before);
  });
});

describe("adding a setup to a job that already has one", () => {
  // addNewSetup builds from the current user's settings rather than copying the
  // setup the user is looking at, so a second setup on the same production line
  // arrives in a different structure from the first.
  it("today: derives the new setup from the recalculating user's settings", async () => {
    const { default: Job } = await import("../src/Classes/job");

    const existing = new Setup({
      runCount: 5,
      jobCount: 1,
      ME: JOB_AS_BUILT.ME,
      TE: JOB_AS_BUILT.TE,
      structureID: JOB_AS_BUILT.structureID,
      rigID: JOB_AS_BUILT.rigID,
      systemTypeID: JOB_AS_BUILT.systemTypeID,
      systemID: JOB_AS_BUILT.systemID,
      taxValue: JOB_AS_BUILT.taxValue,
      customStructureID: JOB_AS_BUILT.customStructureID,
      characterToUse: JOB_AS_BUILT.character,
      jobType: 1,
    });

    const job = Object.create(Job.prototype);
    job.jobType = 1;
    job.blueprintTypeID = 1234;
    job.maxProductionLimit = 10;
    job.skills = [];
    job.rawData = { products: [{ quantity: 1 }], materials: [], time: 100 };
    job.build = { setup: { [existing.id]: existing } };
    job.layout = { setupToEdit: existing.id };

    job.addNewSetup(emptyQueryClient());

    const added = Object.values(job.build.setup).find((s) => s.id !== existing.id);
    expect(added).toBeDefined();
    expect(added.customStructureID).toBe(RECALCULATING_USER.customStructureID);
    expect(added.ME).toBe(RECALCULATING_USER.defaultME);
    expect(added.selectedCharacter).toBe(RECALCULATING_USER.mainCharacter);
  });
});
