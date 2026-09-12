import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RoutePending } from "./Components/routePending";
import { RouteNotFound } from "./Components/routeNotFound";

/**
 * How every route loads, pends and fails. Held apart from the instance so a test can
 * mount the app's own behaviour rather than an approximation of it.
 */
export const appRouterOptions = {
  routeTree,
  // Routes are lazy chunks: without this the download starts on click and the
  // old page stays on screen, unresponsive, until it lands.
  defaultPreload: "intent",
  defaultPendingComponent: RoutePending,
  // A route whose loader cannot find what the URL names says so, rather than the
  // router's bare "Not Found".
  defaultNotFoundComponent: RouteNotFound,
  // A loader now fetches a job or a group's members, so intent preloading reaches the
  // network. Holding what it found for a moment keeps a hovered list from refetching
  // the same rows per card.
  defaultPreloadStaleTime: 30_000,
  defaultPendingMs: 150,
  defaultPendingMinMs: 300,
};

/** Single router instance for Sentry TanStack integration (init) and {@link RouterProvider}. */
export const appRouter = createRouter(appRouterOptions);
