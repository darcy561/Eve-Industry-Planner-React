import { routeTree } from "../routeTree.gen.js";

/**
 * What a route says about who may be on it.
 *
 * - `public` — usable signed out, and a stored session is rebuilt before it renders.
 * - `private` — needs a signed-in reader.
 * - `transient` — `/auth` and `/signout`: never guarded, never a place to return to.
 */
export const ROUTE_AUDIENCES = Object.freeze([
  "public",
  "private",
  "transient",
]);

/** The pathless layout whose children need a signed-in reader. */
const PROTECTED_LAYOUT_ID = "/_protected";

/**
 * Every route the app has, read from the generated tree so a new page is covered the
 * day it is added.
 *
 * Read on first use, not at module scope: the generated tree imports the route files,
 * which import this module, so `routeTree` is still in its dead zone while this one
 * evaluates.
 */
let routes;

function appRoutes() {
  routes ??= collectRoutes(routeTree, false);
  return routes;
}

/**
 * @typedef {Object} RouteAccess
 * @property {string} pattern - The route's path, params still written as `$name`.
 * @property {string} audience - One of {@link ROUTE_AUDIENCES}; private when undeclared.
 * @property {boolean} declared - Whether the route stated its own audience.
 * @property {boolean} resumeSession - Whether a stored session is rebuilt here.
 * @property {boolean} hasParam
 * @property {boolean} underProtectedLayout
 */

/** Every route, in tree order. */
export function allRoutes() {
  return appRoutes();
}

/** The route a path belongs to, or undefined when the app has none. */
export function routeForPath(path) {
  const [pathname] = path.split(/[?#]/);
  // A literal wins over a param, so /group/new is itself rather than a group id.
  const known = appRoutes();
  return (
    known.find(
      (route) => !route.hasParam && matches(pathname, route.pattern),
    ) ?? known.find((route) => matches(pathname, route.pattern))
  );
}

function collectRoutes(route, underProtectedLayout) {
  // A route's own `path` and `id` only exist once the router has initialised; `options`
  // is what the generated tree carries, and is there whether it has or not.
  const { path, id, staticData } = route.options ?? {};
  const isUnderLayout = underProtectedLayout || id === PROTECTED_LAYOUT_ID;
  const here = path
    ? [
        {
          pattern: path,
          audience: staticData?.audience ?? "private",
          declared: Boolean(staticData?.audience),
          resumeSession: staticData?.resumeSession !== false,
          hasParam: hasParam(path),
          underProtectedLayout: isUnderLayout,
        },
      ]
    : [];

  return Object.values(route.children ?? {}).reduce(
    (all, child) => all.concat(collectRoutes(child, isUnderLayout)),
    here,
  );
}

function hasParam(pattern) {
  return segments(pattern).some((segment) => segment.startsWith("$"));
}

function segments(path) {
  return path.split("/").filter(Boolean);
}

function matches(path, pattern) {
  const pathSegments = segments(path);
  const patternSegments = segments(pattern);
  if (pathSegments.length !== patternSegments.length) return false;

  return patternSegments.every(
    (segment, index) =>
      segment.startsWith("$") || segment === pathSegments[index],
  );
}
