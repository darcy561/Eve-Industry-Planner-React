# Session and route access

## Owns

How the SPA decides **who may be on a route**, **when a stored session is rebuilt**, and **where a
reader lands afterwards** — moving all three from the four places that answer them today onto one
declaration per route, read by one guard.

- **What a route declares about itself** — the audience values, what each one means for guarding,
  resuming and landing, and why a route with no declaration is treated as private.
- **One guard instead of seven** — what the root `beforeLoad` does with a route's declaration, and
  what is left of the per-route guards after it.
- **Rebuilding a session without leaving the page** — running the resume where the reader already is,
  so a refresh on a URL carrying params returns to that same URL with its params intact.
- **What "the login has finished" means** — the difference between authenticated and ready to show
  jobs, why the second one is the gate, and where the state that answers it lives.
- **The login screen as a state rather than a place** — showing login progress on the route the reader
  asked for instead of holding them on `/auth`.
- **What travels through the OAuth handshake** — a single-use nonce rather than a path, the per-tab
  entry it keys, and what a returning target is validated against before the router is handed it.
- **Where a reader lands after signing in**, including from a deep link into a private page.
- **What a page needs beyond a finished login** — the job or the group members the login's steps do
  not load, and the route saying so rather than the page fetching its way into existence.

**Not live SoT** until this project is complete and promotion is approved.

Named for the **work**, not a git branch. **Project close** = plan stages done + live-SoT **promote**
(go-ahead).

## Does not own

- **How authentication works today** — the planner session, cookies, token acquisition, the ESI
  credential provider, and the current guard behaviour →
  [frontend/auth/spa.md](../../frontend/auth/spa.md) and
  [backend/api/auth/overview.md](../../backend/api/auth/overview.md). Live SoT, untouched until this
  project promotes. Its § Route guards and § Signing in are two of this project's promote targets.
- **Router configuration, page chrome and the page transition** →
  [frontend/navigation/spa.md](../../frontend/navigation/spa.md). This project changes what a route
  declares and what the root guard does with it; preload behaviour, the pending splash timings, the
  layout and `usePageKey` are that doc's and stay as they are. It is the other promote target.
- **The server-side auth stack** — session rejection shape, account-wide revocation, auth
  observability, cloud credential failures, bootstrap half-success →
  [auth-hardening/contents.md](../auth-hardening/contents.md). Nothing here changes an API contract.
- **Whether the planner session needs a CSRF defence of its own** (that project's § Stage F, #32).
  The nonce this project puts in the OAuth `state` protects the **SSO handshake** — it says a callback
  answers a login this tab started. It is not the session-cookie question and does not close it.
- **What a session's grants mean and the membership revocation path** →
  [shared-planners/contents.md](../shared-planners/contents.md).
- **What the planner does with job data once it has loaded** — the store slices, the bootstrap steps'
  own contents, and the prefetch scheduler. This project gates *when* a job-bearing page renders; it
  does not change what is loaded or in what order.
- **The side menu's appearance** → [app-shell-rollout/contents.md](../app-shell-rollout/contents.md).
  This project changes which entries a signed-out reader sees and where that answer comes from, not
  how the menu looks.

## Task map

| I need to… | Read |
|------------|------|
| Understand what decides route access today, and where | [plan.md](./plan.md) § Starting position |
| See the counts and call sites behind that | [measurements/inventory.md](./measurements/inventory.md) |
| Know why a refresh loses the search params today | [plan.md](./plan.md) § What the redirect actually costs |
| Understand what a route declares | [plan.md](./plan.md) § What a route declares |
| See the audience of every route | [plan.md](./plan.md) § The route table |
| Understand what the one guard does | [plan.md](./plan.md) § One guard |
| Know why the resume can move off `/auth` | [plan.md](./plan.md) § Why the resume can move |
| Understand what has to finish before jobs are shown | [plan.md](./plan.md) § Authenticated is not ready |
| Know why a finished login still does not mean a page can draw | [plan.md](./plan.md) § Login complete is not data complete |
| See how login progress is shown without moving the reader | [plan.md](./plan.md) § The login screen is a state |
| Follow a refresh on an edit job URL end to end | [plan.md](./plan.md) § The worked case: refreshing a job with a group in its search |
| Understand what travels through EVE and what is validated | [plan.md](./plan.md) § What crosses the handshake |
| Check what is additive and what breaks | [plan.md](./plan.md) § Wire compatibility |
| See the stages and their order | [plan.md](./plan.md) § Stages |
| Check what has landed | [plan.md](./plan.md) § Stage status |
| See what has been decided | [plan.md](./plan.md) § Settled |
| See what is still undecided | [plan.md](./plan.md) § Open questions |
| See the live-doc corrections this project owes | [plan.md](./plan.md) § What promote has to fix |
| Know how the routing is tested, and what is not covered | [overlay.md](./overlay.md) § How this is tested |
| See how a part works while the project is in flight | [overlay.md](./overlay.md) |
