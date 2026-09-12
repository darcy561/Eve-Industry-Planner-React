import {
  createFileRoute,
  redirect,
  lazyRouteComponent,
} from "@tanstack/react-router";
import useUsersStore from "../Zustand/usersStore";
import { getRedirectPathAfterAuth } from "../utils/routeUtils";
import { startLogin } from "../Functions/Auth/loginProgress.js";

const AuthMainUser = lazyRouteComponent(
  () => import("../Components/Auth/MainUserAuth"),
);

export const Route = createFileRoute("/auth")({
  staticData: { audience: "transient" },
  beforeLoad: ({ search }) => {
    const state = useUsersStore.getState();
    const isLoggedIn = state.account.isLoggedIn;

    // If user is already logged in, redirect them away from auth page
    if (isLoggedIn) {
      // Get the original path from the state parameter
      const originalPath = search.state;

      // Determine redirect path using the utility function
      const redirectPath = getRedirectPathAfterAuth(originalPath, "/dashboard");

      // Clean up the originalPath from localStorage after determining redirect
      if (originalPath) {
        localStorage.removeItem("originalPath");
      }

      throw redirect({
        to: redirectPath,
      });
    }

    // Before the page renders, so it never paints the last login's finished steps.
    startLogin();
  },
  component: AuthMainUser,
});
