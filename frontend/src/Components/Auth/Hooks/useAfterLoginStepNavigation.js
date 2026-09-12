import { useEffect, useRef } from "react";
import { emitLoginComplete, LOGIN_STEPS } from "../../../Events/loginEvents";
import { getRedirectPathAfterAuth } from "../../../utils/routeUtils";
import { getAuthCallbackParams } from "../oauthUrlParams";
import useUsersStore from "../../../Zustand/usersStore";

/**
 * When every {@link LOGIN_STEPS} has completed, emit login complete and put the reader
 * back where they were before signing in.
 * @param {object} p
 * @param {Set<string|number|symbol>} p.completedSteps
 * @param {import("@tanstack/react-router").UseNavigateResult} p.navigate
 */
export function useAfterLoginStepNavigation({ completedSteps, navigate }) {
  const hasNavigated = useRef(false);

  useEffect(() => {
    const allStepsDone = Object.values(LOGIN_STEPS).every((step) =>
      completedSteps.has(step),
    );
    if (!hasNavigated.current && allStepsDone) {
      hasNavigated.current = true;
      emitLoginComplete();

      const { state: returnTo } = getAuthCallbackParams();
      const state = useUsersStore.getState();
      const needsFirstLoginFlow =
        state.account.actions.getRequiresFirstLoginFlow();
      const redirectPath = needsFirstLoginFlow
        ? "/first-login"
        : getRedirectPathAfterAuth(returnTo, "/dashboard");
      navigate({ to: redirectPath });
    }
  }, [completedSteps, navigate]);
}
