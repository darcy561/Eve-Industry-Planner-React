import { useSyncExternalStore } from "react";
import { LOGIN_STEPS } from "../../../Events/loginEvents";
import {
  loginProgress,
  subscribeToLoginProgress,
} from "../../../Functions/Auth/loginProgress";

/**
 * Login progress, for a component that displays it.
 *
 * The state lives outside React so steps completing before this mounts are still
 * counted; this reads it.
 */
export function useLoginState() {
  const { completedSteps, currentStep, error, userData } = useSyncExternalStore(
    subscribeToLoginProgress,
    loginProgress,
  );

  return {
    completedSteps,
    currentStep,
    error,
    userData,
    isStepComplete: (step) => completedSteps.has(step),
    isLoginComplete: () =>
      Object.values(LOGIN_STEPS).every((step) => completedSteps.has(step)),
  };
}
