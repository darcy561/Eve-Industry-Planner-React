import { eventEmitter } from "../../utils/EventSystem";
import { LOGIN_STEPS } from "../../Events/loginEvents";

const ALL_STEPS = Object.values(LOGIN_STEPS);

/**
 * How far the current login has got, held outside React.
 *
 * The steps are emitted by the bootstrap calls, which start as soon as a login does —
 * before anything displaying progress has mounted, and before a route guard awaiting
 * completion could have subscribed. State kept in a component would lose those, so this
 * module listens from import and every reader asks it rather than the emitter.
 */
let state = noLoginYet();
let running = false;
const listeners = new Set();
let finish;
let completion = arm();

function noLoginYet() {
  return {
    completedSteps: new Set(),
    currentStep: null,
    error: null,
    userData: { eveLoginComplete: false, userArray: [] },
  };
}

function arm() {
  return new Promise((resolve) => {
    finish = resolve;
  });
}

function publish(next) {
  state = next;
  if (ALL_STEPS.every((step) => next.completedSteps.has(step))) {
    running = false;
    finish();
  }
  listeners.forEach((listener) => listener());
}

/**
 * Marks a login as beginning: clears what the last one reached and arms a fresh
 * completion, so a second login in the same tab never reads the first one's steps as
 * its own.
 *
 * More than one entry point can open the same login — the page and the resume both say
 * so — and starting again is how a retry after a failed one gets a clean slate.
 */
export function startLogin() {
  running = true;
  completion = arm();
  publish(noLoginYet());
}

/**
 * Resolves when every step of the login started by the most recent {@link startLogin}
 * has completed. A login that errors does not resolve it — the error is in the snapshot.
 *
 * @returns {Promise<void>}
 */
export function whenLoginComplete() {
  return completion;
}

/** Whether a login is under way. True from {@link startLogin} until the last step. */
export function isLoginRunning() {
  return running;
}

/** The current progress. A new object on every change, the same one between changes. */
export function loginProgress() {
  return state;
}

/**
 * @param {() => void} listener
 * @returns {() => void} Unsubscribe.
 */
export function subscribeToLoginProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// One set of listeners on a shared emitter that outlives this module: a hot reload
// re-runs it, and a second set would leave two divergent copies of the progress.
if (!import.meta.hot || !window.__LOGIN_PROGRESS_LISTENING__) {
  if (import.meta.hot) window.__LOGIN_PROGRESS_LISTENING__ = true;
  listen();
}

function listen() {
  eventEmitter.on("loginStepComplete", ({ step }) => {
    publish({
      ...state,
      completedSteps: new Set([...state.completedSteps, step]),
      currentStep: step,
      error: null,
    });
  });

  eventEmitter.on("loginError", (step, error) => {
    publish({
      ...state,
      currentStep: step,
      error: { step, message: error.message },
    });
  });

  eventEmitter.on("loginComplete", () => {
    publish({ ...state, completedSteps: new Set(ALL_STEPS) });
  });

  eventEmitter.on("userDataUpdate", ({ userData }) => {
    publish({
      ...state,
      userData: {
        ...state.userData,
        eveLoginComplete: userData.eveLoginComplete,
        userArray: mergeUsers(
          state.userData.userArray,
          userData.userArray ?? [],
        ),
      },
    });
  });
}

/** One entry per character: a login reports the same character more than once. */
function mergeUsers(held, incoming) {
  const seen = new Set();
  const merged = [];
  for (const user of [...held, ...incoming]) {
    const id = user?.CharacterID;
    if (id == null || Number.isNaN(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(user);
  }
  return merged;
}
