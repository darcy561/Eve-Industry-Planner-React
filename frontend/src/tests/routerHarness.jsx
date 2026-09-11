import { render } from "@testing-library/react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

const theme = createTheme();

/**
 * Mounts `ui` at `/` under a memory router, with a theme for `useMediaQuery` to read
 * breakpoints off.
 *
 * A link renders an `href` only once the router can resolve its target, so a path left
 * out of `paths` renders as a dead control and the test passes for the wrong reason.
 *
 * @param {React.ReactNode} ui
 * @param {string[]} [paths] - Route paths `ui` links to, beyond `/`.
 * @returns {Promise<import("@testing-library/react").RenderResult>}
 */
export async function renderWithRouter(ui, paths = []) {
  const rootRoute = createRootRoute({ component: Outlet });
  const routes = [
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/",
      component: () => <ThemeProvider theme={theme}>{ui}</ThemeProvider>,
    }),
    ...paths.map((path) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path,
        component: () => null,
      }),
    ),
  ];
  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  // The router resolves its first match before anything renders; without this the tree
  // comes back empty and every query fails on nothing.
  await router.load();
  return render(<RouterProvider router={router} />);
}
