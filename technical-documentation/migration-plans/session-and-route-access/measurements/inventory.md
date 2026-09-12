# Inventory — what decides route access today

Collected against the working tree on 2026-09-12, `frontend/` at `@tanstack/react-router` 1.170.33.
Raw counts and call sites, kept so a later reader can check the plan's claims without re-deriving
them.

## Every route and what guards it

From `src/routes/`, cross-checked against the generated `src/routeTree.gen.js`.

| Route file | URL | `beforeLoad` today |
|---|---|---|
| `__root.jsx` | — | first-login redirect |
| `index.jsx` | `/` | none |
| `auth.jsx` | `/auth` | redirect away when already signed in |
| `signout.jsx` | `/signout` | the whole session teardown, then `throw redirect({to:"/"})` |
| `jobplanner.jsx` | `/jobplanner` | `allowPublicAccess` |
| `reprocessing.jsx` | `/reprocessing` | `allowPublicAccess` |
| `itemtrees.jsx` | `/itemtrees` | `allowPublicAccess` |
| `group/new.jsx` | `/group/new` | `allowPublicAccess` |
| `group/$groupID.jsx` | `/group/$groupID` | `allowPublicAccess` |
| `editjob/$jobID.jsx` | `/editjob/$jobID` | `allowPublicAccess` |
| `_protected.jsx` | — (pathless) | `requireAuth`, then a first-login redirect |
| `_protected/dashboard.jsx` | `/dashboard` | inherited |
| `_protected/accounts.jsx` | `/accounts` | inherited |
| `_protected/settings.jsx` | `/settings` | inherited |
| `_protected/asset-library.jsx` | `/asset-library` | inherited |
| `_protected/blueprint-library.jsx` | `/blueprint-library` | inherited |
| `_protected/archived-jobs.jsx` | `/archived-jobs` | inherited |
| `_protected/first-login.jsx` | `/first-login` | inherited |

16 routes with a path, one pathless layout, one root. Seven `beforeLoad` declarations carry access
logic; `allowPublicAccess` appears at six call sites.

## The four places that answer an access question

| Question | Answered in | Shape |
|---|---|---|
| Does this need a signed-in reader? | `routes/_protected.jsx`, and `allowPublicAccess` on six routes | route guards |
| Should a stored session resume here? | the same `allowPublicAccess` — on six routes, absent from `/` | route guards |
| May a reader land here after signing in? | `utils/routeUtils.js` | matches the path against the route tree, and treats any `$param` route as private |
| Should this appear in the side menu? | `Components/Header/Components/sidemenu.jsx` | `isLoggedIn &&` around Asset Library, Blueprint Library, Archived Jobs, and the Accounts/Settings/Sign Out block |

The menu's gated entries are exactly the `_protected` children, maintained by hand in a second place.

## The two answers that disagree

`routes/editjob/$jobID.jsx` and `routes/group/$groupID.jsx` both declare `allowPublicAccess` — public
by the route's own statement. `getRedirectPathAfterAuth` treats both as private, because they carry a
param. The superseded implementation reached the same verdict through hardcoded regexes
(`/^\/editjob\/\w+$/`, `/^\/group\/\w+$/`).

Consequence, reproducible today: a reader who opens a shared `/group/<id>` link while holding a stored
session is signed in and then delivered to `/dashboard` instead of the group they clicked.

## What the redirect carries

`allowPublicAccess` redirects with `search: { state: location.pathname }` — **pathname only**. The
router's `ParsedLocation` also offers `href`, documented as "the full path of the location, including
pathname, search, and hash… does not include the origin".

So a resume from `/editjob/abc?activeGroup=g1&pageView=outputs` carries `/editjob/abc` and drops both
search params. The job returns; the group it was opened from does not.

## Where the login actually runs

| Piece | File | React? |
|---|---|---|
| `runAppLogin({ queryClient, mode })` | `Functions/Auth/appLoginFlow.js:242` | no — plain async, store read via `getState()` |
| `queryClient` | `queryClient.js` | module singleton, doc comment: "for the app shell and modules outside React (Zustand actions, guards)" |
| mode selection | `Components/Auth/Hooks/useAuthUrlLogin.js` | a hook, mounted by `/auth` |
| progress display | `Components/Auth/Hooks/useLoginState.jsx` | a hook, accumulates events from mount |
| leave `/auth` when done | `Components/Auth/Hooks/useAfterLoginStepNavigation.js` | waits for every `LOGIN_STEPS` value |

`useAuthUrlLogin` selects between four modes — additional-account window, `oauthCode`,
`cookieCloudResume`, `eveClientRefresh` — and otherwise sends the tab to EVE SSO. Only `oauthCode`
needs to be on the callback route.

## Authenticated is not ready

`applyClientSessionAfterAppTokens` (`appLoginFlow.js:172-228`):

**finished before the function returns** — `applyLoginAuthResponse` (synchronous), then awaited:
`persistCloudMainEsiRefreshToken`, `getPublicCharacterData`,
`buildCorporationObjectFromUserObject`, `runPostLoginAccountSync`.

**started without awaiting** — `prefetchCollections(...).catch(...)`, `bootstrapWatchlistLoginStep()`,
`bootstrapJobGroupsLoginStep()`, `bootstrapJobDocumentsLoginStep()`.

So `runAppLogin` resolves when the reader is authenticated and their character is known, with the
planner's own data still downloading. Readiness is the four `LOGIN_STEPS` — `characterData`,
`jobPlanner`, `groupData`, `watchlistData` (`Events/loginEvents.js:8-13`) — reporting complete.

`useLoginState` builds `completedSteps` from events received **after it mounts**, so a login that
starts before it mounts loses its early steps. Nothing outside React holds that state.

## The state parameter

`getEveSsoAuthorizeUrl(state = "main")` sends `state=main` for a login and `additional:<nonce>` for an
account import. `storeOriginalPathFromOAuthState` stores whatever comes back unless it parses as the
additional-account shape, so `"main"` was stored as a return path. Nothing validates `state`
server-side — `services/api` never reads it.

## Router API facts relied on by the plan

Verified against 1.170.33 rather than assumed:

- A root `beforeLoad` receives the whole matched chain and each match's `staticData`. Probe at `/deep/7`
  returned `matchIds: ["__root__", "/deep/$id"]` with `staticData: [{}, {audience:"public"}]`.
- `staticData` is a documented route option (`@tanstack/router-core` `route.d.ts:109,112`; it is
  absent from `@tanstack/react-router`'s own `route.d.ts`).
- `NavigateOptions.href` accepts a fully built href, and the type's own note says it can point at an
  external target — which is why a returning target has to be validated.
- `router.matchRoutes("/nope", {})` returns `["__root__"]` alone, so "matched nothing but the root" is
  a usable "no such route" signal.
- A route's `.path`/`.id` are getters populated by `router.init()`; before that only `route.options`
  carries them. The superseded `getProtectedRoutes()` read `.path`, so in any process with no router
  constructed it fell through to a hardcoded list that omitted `/archived-jobs` and `/first-login`.
