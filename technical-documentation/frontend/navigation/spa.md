# SPA navigation

Routing, page chrome, and what happens on screen between one page and the next.

## One router, configured once

`appRouter` is the single `createRouter` instance, shared by `RouterProvider` and the Sentry
TanStack integration. Route-loading behaviour is set there rather than per route, so every page
loads the same way:

| Option | Value | What it does |
|--------|-------|--------------|
| `defaultPreload` | `"intent"` | Downloads a route's chunk on hover or focus |
| `defaultPendingComponent` | `LoadingPage variant="route"` | The branded splash |
| `defaultPendingMs` | 150 | Delay before the splash appears |
| `defaultPendingMinMs` | 300 | Minimum time it stays once shown |

Routes are lazy chunks (`lazyRouteComponent`). Without preloading, a chunk's download starts on
click, and the router — which wraps navigation in a React transition — holds the current page on
screen, unresponsive, until it lands. Preloading on intent means the chunk is usually present before
the click. The pending timings cover the case where it is not: a navigation still loading after
150 ms shows the splash, and having shown it, holds it long enough to read.

Route files declare only what they are — `component`, plus any `beforeLoad` or `validateSearch`.
They do not carry their own `Suspense` boundary; the router creates one per match from
`defaultPendingComponent`.

## Page chrome is mounted once

`DefaultPageLayout` — header, content row, footer — is rendered once in `App`, wrapping the
`Outlet`. Page components render their content only.

The header holds state (the side-menu open flag), so a layout rendered per page would tear that
state down on every navigation and flash the chrome. Mounting it above the outlet means only the
page content changes.

The content row is `flexDirection: "row"`: pages place a side drawer beside their main content and
depend on it. Anything wrapping the outlet has to preserve that direction.

Two views deliberately render outside the layout, taking the full viewport: the maintenance banner,
and the route splash when the root match itself is pending.

## Navigating fades the incoming page

`PageTransition` wraps the outlet and fades new content in over
`theme.transitions.duration.enteringScreen`. Only the incoming page is rendered — the outgoing one
unmounts immediately — so a page being left releases its effects and document locks on navigation
rather than being held alive for the length of a fade.

`usePageKey` supplies the key, and it is the **route pattern** (`/editjob/$jobID`), not the resolved
path. Changing a param — opening a child job from an open one, switching group — updates the page in
place. Keying on the path instead would treat a param change as a page change and remount the route,
re-running setup that the route's own effects already handle from their `jobID` / `groupID`
dependencies.

## Signing out is a navigation guard

`/signout` has no component. Its teardown runs in an async `beforeLoad`, which the router awaits
before rendering anything, and which ends by throwing a redirect to `/`.

Ordering inside the teardown matters and is commented at the call site: module-level websocket
coalesce queues are dropped before the Zustand stores reset (a pending flush would otherwise
repopulate job data), and the account store resets first so an in-flight account GET cannot re-merge
application settings in the same tick. Local cleanup runs in a `finally`, so it happens whether or
not the server call succeeded.

A **failed** server logout sets `window.location.href` rather than redirecting: state that broke
logout should not survive into the next session, and only a document load guarantees that.

Because a route carrying a `beforeLoad` counts as pending, signing out uses the same splash timings
as any other navigation — nothing on a fast logout, the branded splash if the server call is slow.
