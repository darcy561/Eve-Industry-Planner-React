import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  emitLoginComplete,
  emitLoginError,
  emitLoginStepComplete,
  emitUserDataUpdate,
  LOGIN_STEPS,
} from "../../Events/loginEvents";
import {
  isLoginRunning,
  loginProgress,
  startLogin,
  subscribeToLoginProgress,
  whenLoginComplete,
} from "./loginProgress";

const EVERY_STEP = Object.values(LOGIN_STEPS);

function completeEveryStep() {
  EVERY_STEP.forEach(emitLoginStepComplete);
}

beforeEach(() => {
  startLogin();
});

describe("following a login", () => {
  it("counts the steps as they report in", () => {
    emitLoginStepComplete(LOGIN_STEPS.CHARACTER_DATA);
    emitLoginStepComplete(LOGIN_STEPS.GROUP_DATA);

    const { completedSteps, currentStep } = loginProgress();
    expect([...completedSteps]).toEqual([
      LOGIN_STEPS.CHARACTER_DATA,
      LOGIN_STEPS.GROUP_DATA,
    ]);
    expect(currentStep).toBe(LOGIN_STEPS.GROUP_DATA);
  });

  // The whole reason this lives outside React: the bootstrap calls emit as soon as a
  // login starts, which is before anything displaying progress has mounted.
  it("counts steps that reported before anyone was watching", () => {
    emitLoginStepComplete(LOGIN_STEPS.CHARACTER_DATA);

    const listener = vi.fn();
    subscribeToLoginProgress(listener);

    expect(loginProgress().completedSteps.has(LOGIN_STEPS.CHARACTER_DATA)).toBe(
      true,
    );
    expect(listener).not.toHaveBeenCalled();
  });

  it("holds the same snapshot until something changes", () => {
    const before = loginProgress();
    expect(loginProgress()).toBe(before);

    emitLoginStepComplete(LOGIN_STEPS.CHARACTER_DATA);
    expect(loginProgress()).not.toBe(before);
  });

  it("tells a subscriber, and stops once it unsubscribes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToLoginProgress(listener);

    emitLoginStepComplete(LOGIN_STEPS.CHARACTER_DATA);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitLoginStepComplete(LOGIN_STEPS.GROUP_DATA);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps one entry per character across repeated reports", () => {
    emitUserDataUpdate({
      eveLoginComplete: false,
      userArray: [{ CharacterID: 1, CharacterName: "Pilot" }],
    });
    emitUserDataUpdate({
      eveLoginComplete: true,
      userArray: [
        { CharacterID: 1, CharacterName: "Pilot" },
        { CharacterID: 2, CharacterName: "Alt" },
      ],
    });

    const { userData } = loginProgress();
    expect(userData.userArray.map((u) => u.CharacterID)).toEqual([1, 2]);
    expect(userData.eveLoginComplete).toBe(true);
  });
});

describe("waiting for a login to finish", () => {
  it("resolves once every step has reported", async () => {
    const finished = vi.fn();
    whenLoginComplete().then(finished);

    completeEveryStep();
    await whenLoginComplete();

    expect(finished).toHaveBeenCalled();
  });

  it("resolves on the completion event without each step", async () => {
    emitLoginComplete();

    await expect(whenLoginComplete()).resolves.toBeUndefined();
  });

  it("does not resolve while a step is outstanding", async () => {
    const finished = vi.fn();
    whenLoginComplete().then(finished);

    emitLoginStepComplete(LOGIN_STEPS.CHARACTER_DATA);
    await Promise.resolve();

    expect(finished).not.toHaveBeenCalled();
  });

  // An error leaves the reader somewhere a decision has to be made, so it must not
  // read as a finished login.
  it("does not resolve on an error", async () => {
    const finished = vi.fn();
    whenLoginComplete().then(finished);

    emitLoginError(LOGIN_STEPS.JOB_PLANNER, new Error("Network timeout"));
    await Promise.resolve();

    expect(finished).not.toHaveBeenCalled();
    expect(loginProgress().error).toEqual({
      step: LOGIN_STEPS.JOB_PLANNER,
      message: "Network timeout",
    });
  });

  it("clears the error when the next step reports", () => {
    emitLoginError(LOGIN_STEPS.JOB_PLANNER, new Error("Network timeout"));
    emitLoginStepComplete(LOGIN_STEPS.JOB_PLANNER);

    expect(loginProgress().error).toBeNull();
  });
});

describe("whether a login is running", () => {
  // The screen shown while the router waits asks this, and it has to be true from the
  // first moment — the earliest step is a network round trip away.
  it("is true from the moment it starts, before any step reports", () => {
    expect(loginProgress().completedSteps.size).toBe(0);
    expect(isLoginRunning()).toBe(true);
  });

  it("is false once every step has reported", async () => {
    completeEveryStep();
    await whenLoginComplete();

    expect(isLoginRunning()).toBe(false);
  });
});

describe("a second login in the same tab", () => {
  // Without this the steps of the first login read as the second one's, and a guard
  // waiting on completion would let a page render against nothing. It is also how a
  // retry after a failed login gets a clean slate.
  it("starts from no steps and waits again", async () => {
    completeEveryStep();
    await whenLoginComplete();

    const finished = vi.fn();
    startLogin();
    whenLoginComplete().then(finished);

    expect(loginProgress().completedSteps.size).toBe(0);
    await Promise.resolve();
    expect(finished).not.toHaveBeenCalled();

    completeEveryStep();
    await whenLoginComplete();
    expect(finished).toHaveBeenCalled();
  });
});
