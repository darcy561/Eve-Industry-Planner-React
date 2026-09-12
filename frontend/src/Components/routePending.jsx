import { useState, useSyncExternalStore } from "react";
import { LoadingPage } from "./loadingPage";
import { UserLogInUI } from "./Auth/LoginUI/LoginUI";
import {
  isLoginRunning,
  subscribeToLoginProgress,
} from "../Functions/Auth/loginProgress";

/**
 * What a reader looks at while the router is holding a navigation.
 *
 * A session rebuilding itself is held by the same pending state as a route chunk
 * downloading, and the two are a different wait: one is worth watching step by step,
 * the other is a moment. So a login in flight shows its own progress, on the page the
 * reader asked for rather than on a page of its own.
 *
 * Once a wait is a login it stays one until the wait ends. The router holds this screen
 * for a minimum, and that hold is over the screen, not over what is inside it — so
 * swapping to the splash the moment the last step landed would take the steps off the
 * reader mid-read and make the hold look like it had been ignored.
 */
export function RoutePending() {
  const loginRunning = useSyncExternalStore(
    subscribeToLoginProgress,
    isLoginRunning,
  );
  const [showingLogin, setShowingLogin] = useState(loginRunning);

  if (loginRunning && !showingLogin) setShowingLogin(true);

  return showingLogin ? <UserLogInUI /> : <LoadingPage variant="route" />;
}
