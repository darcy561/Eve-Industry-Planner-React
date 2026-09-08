# Plan — SPA token acquisition

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
In-scope Go surface is one handler response in `services/api/v1endpoints` (Stage G). `go fix -diff`
run on `./v1endpoints/...` and `./helper/auth/...`: the only suggestions are `omitempty` → plain tags on
`helper/auth` structs that are serialised into Redis, which would change stored JSON shape. Not taken
with this work.
Live SoT will not be edited until this project is complete and promotion is approved.

## Why this project exists

The SPA keeps two auth credentials fresh — a per-character ESI access token and the planner session —
using clocks that live in React's mount lifecycle, and the work splits down a cloud-versus-local branch
that has been copied into seven places. The result reads as two disjoint mechanisms for one job.

The clocks turn out to protect nothing. The planner session's reauth deadline is anchored to session
start rather than sliding, the WebSocket authenticates on a session id that rotation carries forward
unchanged, and EVE OAuth refresh tokens do not decay from disuse. The evidence is in
[current-state.md](./current-state.md).

They exist because the 19 ESI fetchers read `character.esiAccessToken` as a *snapshot* instead of
acquiring a token, so freshness had to be guaranteed from outside. Invert that — make acquisition part
of the call — and the clocks have no remaining purpose, and the storage mode stops being a scheduling
concern.

## Goals

1. A request that needs a token gets a fresh one because it asked, not because a timer happened to run.
2. Cloud versus local is decided in exactly one module, because it is one fact: where the OAuth refresh
   material lives.
3. No auth work runs on a React mount, an interval, or a visibility event.
4. Rotating a token renders nothing, because no rendered state changes when one rotates.
5. Corporation claims and public character data are refreshed as data, on React Query's terms.

## Relationship to the frontend lifecycles roadmap

[`frontend/lifecycles/roadmap.md`](../../frontend/lifecycles/roadmap.md) proposes moving the same
clocks out of React into a boot-time supervisor (its items #1, #2 and #5), and names rewriting
`tokenActions` as a non-goal. This project supersedes that direction: the clocks are deleted rather
than relocated, so the supervisor those items build has nothing left to own.

Two of its items survive intact and are folded in below — plain-module character prefetch (#3) and
lifecycle tests (#6) — and its #4, updating the auth frontend docs, becomes this project's promote step.

That roadmap is live SoT under `frontend/`, so it is **not** edited while this project is active. It is
reconciled on promote: items #1, #2 and #5 close as superseded, and the file is either folded into
[`frontend/auth/spa.md`](../../frontend/auth/spa.md) or removed. Note for whoever promotes — the
frontend documentation rules put migration writing under `migration-plans/` until promoted, so a
roadmap living in the live tree is itself an anomaly to resolve at that point.

## Phase 1 — project docs (gate) — **done**

- [x] Project subfolder under `migration-plans/`
- [x] [contents.md](./contents.md) — owns / does not own / task map
- [x] This plan, with rules acknowledgement
- [x] Row in [`../contents.md`](../contents.md)
- [x] [current-state.md](./current-state.md) — the evidence and the call-site inventory
- [x] [overlay.md](./overlay.md) — how acquisition works after the change

## Stage A — the credential provider

**The whole project turns on this.** One module owning the question *give me a usable ESI access token
for this character*, with the two storage modes as implementations behind it and nothing above it aware
of which is in play.

Built as a factory plus a default singleton, with the two storage modes as plain function records —
not a class, and not under `Classes/`. Shape, rationale and the token-ownership rule:
[overlay.md](./overlay.md) § The provider.

Live access tokens move into the provider and out of the store: `Character` keeps identity and loses
`esiAccessToken` / `esiAccessTokenEXP`. That is what makes rotation render-free — see Stage C.

Done when: both modes resolve a token through the provider; the provider single-flights concurrent
callers for the same character; a failure is classified as recoverable or reauth-required rather than
logged and swallowed; and the provider is the only module reading `userCloudAccounts` for a token
decision.

Wire compatibility: **none** — client-internal. No request or response shape changes, so nothing needs
to deploy in step with anything.

## Stage B — convert the ESI fetchers

Replace the snapshot destructure in all 19 files listed in [current-state.md](./current-state.md)
§ Inventory with a provider call. `Character` keeps its identity fields; token state moves under the
provider.

React Query already dedupes at the query level and the provider dedupes beneath it, so a page mounting
several hooks for one character triggers at most one OAuth refresh.

Done when: no file under `Functions/EveESI/` reads `esiAccessToken` off a passed-in object, and a query
run against an expired token succeeds on the first attempt rather than after a background tick.

Wire compatibility: none.

## Stage C — delete the clocks

Remove, not relocate:

- `Hooks/App/useRefreshESITokens.js` and its call in `App.jsx` — both intervals.
- `runStaggeredEsiTokenStep`, `runEsiTokenIntervalMaintenance`, `runScheduledTokenRefresh` and
  `runTabVisibleAuthRefresh` from `Zustand/account/tokenActions.js`, with the `esStaggerIndex` module
  global and the duplicated expiry arithmetic in the tab-wake path.
- The auth branch of the visibility handler in `Realtime/useAccountWebSocket.js`. The handler stays for
  the realtime resync it also does; it stops doing auth work.

`refreshServerToken` stays — it is the planner session's acquisition path — but is reshaped to run on
actual staleness and its existing 401 recovery rather than being called on every private request behind
a cooldown.

The five `updateCharacters([...get().account.characters])` calls in `tokenActions.js` go with them.
Each one hands `account.characters` a new array identity, and 38 component call sites subscribe to it,
so a token rotation currently re-renders the header, dashboard, account cards, asset pages and
character pickers — none of which display a token. Once tokens live in the provider (Stage A), a
rotation touches no store state and renders nothing.

Per [`../technical-rules.md`](../technical-rules.md), the deletions are complete: no forwarding
wrappers, no hook left as a thin re-export.

Done when: nothing schedules auth work, and login, cold reload, add-alt, sign-out and a long idle
period all still resolve tokens.

Wire compatibility: none.

## Stage D — corporation claims as data

`updateCorporationClaims` and `getPublicCharacterData` ride the 15m maintenance interval today because
that clock existed. They are data currency: give them a query key and a `staleTime` matching the
cadence they need.

Done when: claims refresh on React Query's schedule and no auth code path calls them.

Wire compatibility: none.

## Stage E — plain-module character prefetch

Carried over from the lifecycles roadmap #3. `useCharacterHooks` is a hook wrapper around prefetch
functions that need no React state. Export plain functions taking `queryClient`, and convert the call
sites in `useAuthUrlLogin`, `runPostLoginAccountSync` and `AdditionalAccounts`.

Done when: login and add-alt prefetch the same query keys with no hook in the path.

Wire compatibility: none.

## Stage F — tests

Carried over from the lifecycles roadmap #6, retargeted at acquisition rather than timers. Tests ship
with each stage above, not as a wave after them.

Cover: the provider returning a cached token inside the buffer and refreshing outside it; concurrent
callers for one character producing one refresh; each storage mode's failure classified correctly; a
fetcher succeeding against an initially expired token; and a rotation producing no store update, which
is the property most easily lost to a later well-meaning edit.

## Latency, and the escape hatch if it bites

Removing the clocks means the first query after idle pays an OAuth round-trip, once per character.
Several hooks set `refetchOnWindowFocus: false`, so focus will not warm every token — see
[current-state.md](./current-state.md) § Latency.

If that proves noticeable in use, the fix is one opportunistic call to the provider for the main
character on visibility, which no-ops when the token is fresh. That is a handful of lines and needs no
scheduler. **Do not build it pre-emptively** — take it only against an observed symptom.

## Stage G — the stuck-session defect

**A named defect, not a cleanup.** A planner session can reach a state where every private request
fails and nothing recovers or redirects. The chain, verified end to end:

1. Rotation is single-use — `services/api/v1endpoints/refresh.go:347` revokes the presented refresh
   token once the replacement is issued.
2. If the client never stores the replacement — the response is lost, the tab closes mid-flight, or a
   second tab already rotated the same string — its stored token is permanently dead.
3. Presenting a dead token returns `refresh.go:129`: HTTP 401 with the plain-text body `Invalid token`,
   carrying **no** `code` field.
4. `parsePlannerAuthCodeFromText` therefore returns `null`, so
   `redirectToFullEveLoginIfTerminal` does not fire — `session_missing` is parsed but is not in
   `PLANNER_TERMINAL_AUTH_CODES` either.
5. `refreshServerToken`'s catch logs the message and returns. It clears nothing. The re-establish
   branch is guarded on `!cloud`, so cloud accounts have no recovery path at all.
6. `lastPlannerSessionValidatedAt` is only written on success, so the 20m cooldown never engages and
   **every** private request retries the whole sequence.

Step 6 is why it presents as a loop rather than a quiet failure. Stages A–C remove that amplifier on
their own — on-demand acquisition attempts once and records the failure — but they do not fix steps 3
to 5, so this stage stands whether or not the rest lands.

**Duplicating a browser tab reproduces it.** `sessionStorage` is copied into the duplicate, so both
tabs hold the same refresh token; the first to rotate revokes it under the second.

The fix has three parts:

- **Server:** return a coded JSON body for a not-found refresh token, as the reauth path already does
  via `writeRefreshAuthError`, instead of `http.Error`'s plain text. `refresh.go:129` is the site.
- **Client:** treat that code as terminal, so the tab clears its session material and goes to full SSO
  instead of retrying forever.
- **Client:** hold a failure state on the session subject, so a rotate that failed is not re-attempted
  by the next request until something changes. Today only success is recorded.

Done when: a tab holding a revoked refresh token reaches full SSO on its next private request rather
than failing every request indefinitely; and duplicating a logged-in tab leaves both tabs working or
sends the loser to SSO once.

Wire compatibility: **additive.** A 401 that carried an uncoded plain-text body gains a `code` field.
No status, route or success shape changes, and an older SPA that ignores the field behaves exactly as
it does today — so the API can ship ahead of the SPA.

## Recommended pickup order

1. **Stage G** — the stuck-session defect. Independent of the rest, and the only stage fixing a
   symptom users hit today. Take it first.
2. **Stage A** — the provider, with its tests. Everything else depends on it.
3. **Stage B** — convert the fetchers.
4. **Stage C** — delete the clocks, once nothing depends on them.
5. **Stage D** — claims as data.
6. **Stage E** — prefetch module.

## Non-goals

- Removing either storage mode. Local accounts exist so credentials never leave the browser; collapsing
  to cloud-only is a product and wire decision, not this refactor.
- A Service Worker or any other background runtime owning tokens.
- Changing React Query keys, `staleTime` or invalidation for ESI domain data.
- Changing any auth request or response shape.
