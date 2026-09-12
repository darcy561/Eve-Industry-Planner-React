import { runAppLogin } from "./appLoginFlow.js";
import { startLogin, whenLoginComplete } from "./loginProgress.js";
import { redirectToFullEveLoginIfTerminal } from "./plannerSessionRedirect.js";
import { hasResumablePlannerSession } from "./tabSessionStorage.js";

/**
 * Rebuilds a session the browser already holds credentials for, and waits until the
 * planner has the data to draw.
 *
 * Only a fresh sign-in has to leave the app; this is a token exchange followed by a
 * download, so it runs wherever the reader already is. It resolves on the login's
 * steps, not on `runAppLogin`, because that returns once the reader is authenticated
 * with the job and group data still arriving.
 *
 * A terminal credential sends the tab to EVE rather than reporting back — there is
 * nothing a caller could do with it.
 *
 * @param {Object} p
 * @param {import("@tanstack/react-query").QueryClient} p.queryClient
 * @returns {Promise<boolean>} Whether the session was rebuilt.
 */
export async function resumeStoredSession({ queryClient }) {
  if (!hasResumablePlannerSession()) return false;

  const storedEsiRefresh = localStorage.getItem("Auth");
  const hasLocalEsiRefresh =
    typeof storedEsiRefresh === "string" && storedEsiRefresh.trim().length > 0;

  // A cloud account drops the local ESI refresh once the server holds it, so the
  // absence of one is what says to resume from the tab and the cookie instead.
  const mode = hasLocalEsiRefresh
    ? { type: "eveClientRefresh", eveClientRefreshToken: storedEsiRefresh }
    : { type: "cookieCloudResume" };

  startLogin();
  try {
    await runAppLogin({ queryClient, mode });
  } catch (error) {
    console.error("Session resume failed:", error);
    redirectToFullEveLoginIfTerminal(error);
    return false;
  }

  await whenLoginComplete();
  return true;
}
