import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { LoadingPage } from "./Components/loadingPage";

/** Single router instance for Sentry TanStack integration (init) and {@link RouterProvider}. */
export const appRouter = createRouter({
  routeTree,
  // Routes are lazy chunks: without this the download starts on click and the
  // old page stays on screen, unresponsive, until it lands.
  defaultPreload: "intent",
  defaultPendingComponent: () => <LoadingPage variant="route" />,
  defaultPendingMs: 150,
  defaultPendingMinMs: 300,
});
