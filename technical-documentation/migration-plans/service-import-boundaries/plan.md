# Service import boundaries — plan

**Rules:** Read and following [`../documentation-rules.md`](../documentation-rules.md)
and [`../technical-rules.md`](../technical-rules.md) (migration-plans).
Phase 1 (project folders/docs) before any product work.
For Go surfaces in scope only: `go fix -diff` before planned work; again on edited packages (not unrelated code).
Live SoT will not be edited until this project is complete and promotion is approved.

## Goal

No service under `services/` imports another service's packages. Each is its own deployable; code two
services need lives in `services/shared/`.

Seven files break this today. All seven reach into `api/`, which makes `api` an accidental library for
the rest of the fleet: a change to a session helper there can alter worker, core and websocket
behaviour, and the import graph says the API service must build before they do.

## The crossings

| From | File | Imports | Uses |
|------|------|---------|------|
| core | `core/singleton/jobs.go` | `api/helper/auth` | `RunAuthSessionMaintenanceLoop`, `SessionCleanupOptionsFromEnv` |
| core | `core/commands/prepare_release.go` | `api/helper/auth` | `RepairSessionGrants` |
| worker | `worker/tasks/maintenance/prune_expired_sessions.go` | `api/helper/auth` | `RunAuthSessionMaintenance`, `SessionCleanupOptionsFromEnv` |
| worker | `worker/tasks/esi/update_account_session_grants.go` | `api/helper/auth` | `UpdateAccountSessionGrants`, `StoreCorporations`, `StoreAlliances` |
| websocket | `websocket/server/handler.go` | `api/helper/auth` | `AccountSession`, `AccountSessionsKeyPrefix`, `SessionTTL`, `ExtractAccountSession`, `GetAccountSessionsRecord`, `ReadAppSessionCookie`, `ResolvePlannerSessionID`, `PlannerSessionIDQueryParam`, `ReauthDeadlineFromSessionStart`, `UpsertAccountSession`, `RepairSessionGrants`, `UpdateAccountSessionGrants` |
| websocket | `websocket/server/logging.go` | `api/helper/auth` | `AuthSessionFailureDetailFromError`, `TouchAccountSession` |
| websocket | `websocket/app.go` | `api/middleware` | `RequestLoggingConstructor`, `RequestStartTimeConstructor` |

Two surfaces are involved: **account sessions** (six of the seven files) and **HTTP request
middleware** (one). Both are parts of `api/` that were never API-specific.

EVE SSO token validation, once a third crossing, is not one any more — `ValidateEveSSOToken` lives in
`shared/evesso`, and `update_account_session_grants.go` already calls it there.

## What the session surface actually looks like

`api/helper/auth` is 16 non-test files and roughly 2,500 lines, and it **imports nothing from
`api/`** — only `shared/redis`, `shared/logs`, `shared/models`, `shared/wsplacement`,
`shared/evesso` and `shared/dependency`. Nothing has to be untangled from the API to move it.

Inside, the files form four layers with a single cycle at the bottom:

| Layer | Files | Lines | Depends on |
|-------|-------|-------|------------|
| **L0 — session kernel** | `session_keys.go`, `account_sessions_record.go`, `refresh_token.go`, `session_store.go`, `session_reauth.go`, `session_grants_repair.go` | ~1,365 | nothing in the package |
| **L1a — request-side reading** | `session_cookie.go`, `auth_session_log.go`, and the session half of `auth_helpers.go` (its EVE SSO token helpers stay in `api`) | ~427 | L0 |
| **L1b — maintenance sweep** | `session_cleanup.go`, plus `VerifyAccountSessionPersisted` and `RevokeRefreshTokenBestEffort` from `session_persist.go` | ~250 | L0 |
| **L2 — browser auth flow** | `app_refresh_cookie.go`, `esi_oauth_storage_cookie.go`, `refresh_credential_log.go`, `refresh_token_rotation.go`, `tenant_affinity_cookie.go`, and `RevokeRefreshTokensForLogout` | ~480 | L0 (the `RefreshTokenTTL` constant only) |

L2 is a clean edge — nothing in the package depends on any of it. L0 looks entangled
(`refresh_token` ↔ `session_store` ↔ `account_sessions_record` ↔ `session_reauth` form a cycle), but
that cycle is an artefact of one file doing two jobs rather than a domain knot. See below.

### The consumer sets are disjoint

| Layer | api | core | worker | websocket |
|-------|-----|------|--------|-----------|
| L0 kernel | ✓ | ✓ | ✓ | ✓ |
| L1a request-side | ✓ | — | — | ✓ |
| L1b maintenance | **—** | ✓ | ✓ | — |
| L2 browser flow | ✓ | — | — | — |

`api` never calls the maintenance sweep or `RepairSessionGrants` — not in product code, not in tests.
They sit in `api/` and only `core`, `worker` and (for the repair) `websocket` use them. Conversely
`core` and `worker` never touch a cookie, and `websocket` never runs maintenance.

Every boundary in that table is one a service already draws, which is the bar for splitting a
package: independent use, not conceptual tidiness.

## The pass-through wrapper layer

`session_store.go` defines `SessionStore`, and its doc comment states the invariant the package
exists to protect: the refresh token, the account sessions record and the two indexes move together,
because a write that lands one and not the rest leaves a session nothing can resolve. Keeping them
behind one type is what makes that a single call instead of a convention every caller remembers.

`SessionStore` is called from **nowhere outside the package**. Every service instead goes through
`refresh_token.go`, where 18 of 27 functions are `NewSessionStore(redisClient).X(...)` — several a
single line — each building a throwaway store and each carrying `*eipredis.Redis` in its signature.

It is a pass-through wrapper layer, not a facade: 27 functions in front of 28 store methods, sharing
not one name with them, and taking the Redis handle as a parameter rather than holding it. It
removes nothing and hides nothing. The invariant the store is built to enforce is re-exposed as
loose functions over a raw connection.

`refresh_token.go` also declares `AccountSession`, `AccountSessionsRecord`, `RefreshTokenData` and
`SessionRecord`. **That is the whole cause of the L0 cycle** — the store needs the types, the
wrappers need the store. Extract the types and the cycle is gone.

### Target layout for the moved code

```
shared/plannersession/
  keys.go      Redis key contract + TTLs                   → (nothing)
  types.go     Session, AccountRecord, RefreshTokenData,
               CorporationIDs, AllianceIDs
  reauth.go    deadline / expiry math                      → types, keys
  record.go    normalize + prune rules                     → types, reauth
  store.go     Store — owns the keyspace                   → keys, types, record, reauth
  grants.go    RepairSessionGrants                         → store, types

shared/plannersession/request/                             → plannersession
  cookie.go    session cookie + planner session id
  failure.go   auth failure classification and log fields
  extract.go   pull a session off an *http.Request

shared/plannersession/maintenance/                         → plannersession
  sweep.go     the periodic prune / orphan sweep
  verify.go    VerifySessionPersisted, RevokeRefreshTokenBestEffort

api/helper/auth/  (browser auth flow, stays)               → plannersession (RefreshTokenTTL)
  app_refresh_cookie.go, esi_oauth_storage_cookie.go, refresh_credential_log.go,
  refresh_token_rotation.go, tenant_affinity_cookie.go, RevokeRefreshTokensForLogout,
  and the EVE SSO token helpers from auth_helpers.go (ValidateEveTokenAndExtractHash,
  GetEveTokenErrorMessage, EveTokenValidationResult, the ErrMsg* constants)
```

Three design changes are folded into that layout:

- **`SessionStore` becomes `plannersession.Store`, and becomes the API.** `plannersession.SessionStore`
  stutters, and there is no second store to disambiguate from.
- **The wrappers go.** The 18 pass-throughs are deleted; the functions carrying real logic
  (`ResolveRefreshTokenForValidSession`, `loadAccountSessionRow`, `TouchAccountSession`,
  `UpdateAccountSessionGrants`, …) become methods on `Store`, which is where the invariant they
  maintain already lives.
- **`reauth.go` stops doing I/O.** Its call to `loadAccountSessionRow` is the one place the expiry
  math reaches storage; that moves onto the store, leaving reauth as pure functions over types.

### Naming

The concept carries five names in this one package — `AccountSession` (34 distinct identifiers),
`AuthSession` (8), `PlannerSession` (8), `AppSession` (5), `SessionRecord` (5) — and the live
backend documentation uses a sixth distribution: "planner session" 13 times, "app session" twice,
"auth session" once, "account session" never. So this is not inventing a name; it is promoting one
of the names already in play and retiring the rest.

**`plannersession`.** It is what the live docs call this, and what the key contract in
`session_keys.go` already calls it. It also keeps these distinct from ESI OAuth sessions — a
distinction the code actively defends, since `RefreshTokenKeyPrefix` is commented "Not ESI OAuth
refresh secrets, which live in Mongo." `authsession` was the main rival and was rejected on exactly
that point: `auth` is the overloaded word here.

`AccountSession` names containment rather than the thing. A session belongs to an account;
`account_sessions:` is the row that groups an account's sessions. So the rename puts "account" on
the container and nothing else:

| Now | Becomes |
|-----|---------|
| `AccountSession` | `Session` |
| `AccountSessionsRecord` | `AccountRecord` |
| `SessionStore` | `Store` |
| `SessionRecord` | deleted — see below |
| `RefreshTokenData` | unchanged |

The `AuthSession*`, `PlannerSession*` and `AppSession*` prefixes go; the package name carries that
meaning at every call site.

**`SessionRecord` is deleted, not renamed.** It is stored nowhere. `UpsertSessionRecord` flattens it
into an `AccountSession` and calls `UpsertAccountSession`; `GetSessionRecord` reads an
`AccountSession` and unflattens it. Its doc comments claim it loads and removes `session:<sessionID>`
from Redis, but there is no `session:` key family — `session_keys.go` declares six and that is not
one of them. Four `api` call sites use it (two of them tests); they build a `Session` directly
instead.

**The Redis keys do not change.** `account_sessions:`, `refresh_token:`, `session_index:`,
`session_refresh:` and the two claim caches keep their current names and layouts. This rename is
Go identifiers only — see § Wire compatibility.

`refresh_token.go` does not survive as a name. It holds four session types and a package-wide
function surface, of which refresh tokens are one of six key families; its contents land in
`types.go` and `store.go`.

**Cost at the call sites:** 23 external calls into the wrapper layer — 14 in `api`, 4 in
`websocket`, 3 in `worker`, 2 in `testing/ws_soak/lib`, none in `core`. They change from
`auth.X(ctx, redis, …)` to a held `Store`. Fewer sites than the import rewrite touches anyway.

## Destinations

| Surface | Goes to | Why |
|---------|---------|-----|
| L0 — session kernel | `shared/plannersession` | Sessions are a domain surface, not a `shared/core/` infrastructure primitive; they sit at the top level of `shared/` beside `evesso`, `wsplacement` and `models` |
| L1a — request-side reading | `shared/plannersession/request` | Only `api` and `websocket` read sessions off an HTTP request; `core` and `worker` should not compile cookie handling |
| L1b — maintenance sweep | `shared/plannersession/maintenance` | Only `core` and `worker` run it, and `api` — its current home — never calls it |
| L2 — browser auth flow | stays in `api/helper/auth` | Refresh-cookie rotation, ESI OAuth storage and tenant affinity are the API's own login flow; no other service references any of it |
| `RequestLoggingConstructor`, `RequestStartTimeConstructor`, and the `MiddlewareConstructor` composition kit | `shared/httpmiddleware` | HTTP plumbing, not stateful infrastructure; sits beside `shared/httpclient` and `shared/compression` |

The three session packages layer cleanly — `request` and `maintenance` both depend on the kernel and
neither depends on the other, so there is no cycle to design around.

### Alternatives considered

- **Move the package whole.** One `git mv`, simplest rewrite. Rejected: it puts 480 lines of
  browser-cookie handling in `shared/` and makes `core` and `worker` compile session-cookie code
  they never call.
- **Kernel plus remainder, two packages.** Move L0+L1a+L1b together, leave L2 behind. Gets the
  browser flow out of shared, but `core` and `worker` still pull in the request-side layer. This is
  the fallback if three packages proves to be too fine a split once the move is underway.
- **Other package names.** `authsession` matches `AuthSessionError` and `RunAuthSessionMaintenance`
  but leans on the one overloaded word in this area. `appsession` matches the cookie names on the
  wire but is vaguer, and the docs use it twice against thirteen. `session` reads best at call sites
  but is too generic beside websocket sessions, and `session.Session` stutters. `usersession` would
  have invented a sixth term for a concept that already has five.
- **Under `shared/core/`.** `shared/core/documentlock` is the nearest precedent — Redis-backed state
  with product behaviour of its own — and it argued for `shared/core/plannersession`. Placement at
  the top level of `shared/` was chosen instead. That also runs with, rather than against,
  [`service-library-modules`](../service-library-modules/plan.md), whose open question 5 asks
  whether the `shared/core/` prefix flattens; a new package added at the top level is one fewer
  path for that project to move.
- **Reshape in place, then move.** No duplicated code and no throwaway harness, and the existing
  tests stay put to prove each step. Rejected: it destroys the thing the new store would be compared
  against, exactly when the change is a rewrite of code whose guarantee is about resulting Redis
  state. It also forces `api` — the largest rewrite and the only one not breaking the boundary rule —
  to be finished before any crossing closes.
- **Move first, reshape later.** The shared package would land in a shape already known to be wrong
  and all 23 call sites would be touched twice.

### The middleware type question

Both constructors return `middleware.MiddlewareConstructor`, declared in `api/middleware/types.go`
alongside `Chain`, `Wrap`, `Group`, `ApplyIf`, `Paths` and `Prefixes`. Three ways to handle it:

1. **Move the composition kit with them.** `shared/httpmiddleware` owns the type and the combinators;
   `api/middleware` keeps its eight API-specific constructors and imports the shared type. One home
   for the vocabulary both services speak.
2. **Retype the two constructors** to plain `func(http.Handler) http.Handler` and leave the kit in
   `api/`. Smallest move, but `websocket` then composes chains by hand while `api` has helpers for it,
   and the two drift.
3. **Duplicate the type** in both packages. Rejected — two declarations of the same contract is the
   scattering the house rules exist to prevent.

**Chosen: option 1.** The type is a contract, not an API implementation detail, and it is what makes
the constructors composable at all. `api/middleware` keeping only its own constructors is the
honest split.

## Phases

Phase 1 is this folder.

### How the session work is sequenced

The reshaped package is **built alongside** the current one rather than replacing it in place. The
old `api/helper/auth` stays untouched and working until every call site has moved, which gives the
new store something to be tested against instead of only tested.

That is worth the duplication here specifically because of what the store guarantees. Its own doc
comment states the invariant: a refresh token names a session, the session-refresh index names the
token, and the session index names the account, so a write that lands one and not the rest leaves a
session nothing can resolve. That is a property of the **resulting keyspace**, not of any return
value — which means it can be checked by running both implementations over the same operations and
comparing the Redis state they leave behind, byte for byte. An in-place reshape cannot offer that
check, because the behaviour being compared against stops existing the moment the file is edited.

Three rules bound the parallel period:

- **Not a runtime A/B.** Both implementations write the same six key families. At any moment a given
  call site uses exactly one of them; the two never run against the same live Redis.
- **The duplicated key contract is deliberate and temporary.** For the window there are two copies of
  the key names and TTLs. The differential harness is what proves they agree, and Stage A4 is what
  ends it. A4 is not optional.
- **`shared/plannersession` imports nothing from `api/helper/auth`.** A dependency between them would
  make the comparison meaningless.

### Stage A1 — Build the new package

Write `shared/plannersession`, `shared/plannersession/request` and
`shared/plannersession/maintenance` to the shape in § Target layout and the names in § Naming.
`api/helper/auth` is not edited and no call site moves, so nothing in production reaches the new code
yet.

The design decisions are already made: `Store` is the API, there are no pass-through wrappers,
`reauth` does no I/O, and `SessionRecord` simply does not exist in the new package.

New tests are written against the new package as usual; the old package keeps its 13 test files
where they are for the duration.

**Landed.** `shared/plannersession` (keys, types, reauth, record, store, grants),
`shared/plannersession/request` (cookie, failure, extract) and
`shared/plannersession/maintenance` (sweep, verify) — roughly 1,700 lines of code and 1,000 of tests, building
and vetting clean, with `go fix -diff` empty before and after. `api/helper/auth` is untouched and its
suite still passes.

Six things the build settled that the plan had not:

- **The request layer is smaller than § Target layout said.** `auth_helpers.go` also held EVE SSO
  token validation — `ValidateEveTokenAndExtractHash`, `GetEveTokenErrorMessage`,
  `EveTokenValidationResult` and the `ErrMsg*` constants. That is not request-side session reading
  and no service but `api` calls it, so it stays behind. Only the context identity and the session
  extraction moved.
- **String matching on errors is gone.** `ExtractAccountSession` told an unindexed session id from a
  stranded index by comparing `err.Error() == "session not found"`. The store now returns
  `ErrSessionNotFound`, `ErrRefreshTokenNotFound` and `ErrNoStore`, and the request layer uses
  `errors.Is`.
- **Six dead exports were not ported.** `IsPlannerSessionReauthExpired` (an alias its own test
  asserts is identical to `IsReauthExpired`), `ExtractAccountID`, `ExtractSessionID`,
  `ExtractAccountIDFromSession`, `ExtractSessionIDFromSession`, and the unused
  `authSessionReasonCookieAbsent` constant. `ReauthDeadline` is unexported, having no caller outside
  the package.
- **The maintenance sweeps no-op on a store with no Redis** by treating `ErrNoStore` as nothing to
  do, which is what the old `redisClient.Driver() == nil` guards did at every entry point.
- **Two regressions were found on recheck and fixed.** `ErrNoStore` did not classify as a dependency
  outage the way `eipredis.ErrNoClient` does, so a missing Redis connection would have reached
  clients as 401 rather than 503; it now wraps that sentinel. And `ExtractSession` had lost the
  up-front connection guard, so a request with no session id during a Redis outage was answered
  "session missing" instead of reporting the outage; `Store.Available` restores it. Both are pinned
  by tests.
- **`RevokeRefreshTokensForLogout` stays in `api`** with the browser flow, and it is *not* equivalent
  to `Store.RevokeSessionTokens`: logout checks the refresh index and the scan separately, while the
  store consults the index first and only scans on a miss. Whether those can diverge is a case for
  Stage A2 to answer rather than something to assume.

### Stage A2 — Differential harness

A test that replays one operation sequence against two isolated fake Redis instances — the old
package against one, the new against the other — and asserts both the returned values and the full
resulting keyspace match: every key, every value, every TTL.

Home: the repo-root `testing` module, which may import service packages. `testing/redisfake` already
wraps miniredis, whose `Keys`, `Dump` and `TTL` give the snapshot directly, so each case is two fakes
and a comparison.

Cover the operations that touch more than one key family, since those are the ones the invariant is
about: `PutRefreshToken` (token plus refresh index), `PutSession` (record plus session index),
`RemoveSession`, `RevokeSessionTokens`, `DeleteSessionIndexes`, concurrent `UpdateAccountSessions`,
the maintenance sweep, and `RepairSessionGrants`.

Compare the errors as well as the state. Both regressions Stage A1's recheck found were invisible to
state comparison: they were about how a failure *classifies* — whether a missing connection reads as
a dependency outage or as the caller's fault — which is what the middleware above turns into 503 or
401.

**Done when:** every operation the crossings named in § The crossings depend on is covered, the two
implementations agree on all of them, and the errors they return classify the same way under
`dependency.IsUnavailable`.

### Stage A3 — Cut the call sites over

Service by service, and **not** in size order — the point of the project is the boundary, so the
services that break it go first:

1. **core** (2 crossings; no wrapper calls at all — only the sweep and the repair).
2. **worker** (2 crossings, 3 wrapper calls).
3. **websocket** (2 crossings, 4 wrapper calls; the `apihelperauth` alias goes).
4. **`testing/ws_soak/lib`** (2 calls).
5. **api** (14 wrapper calls) — last, and the only one that is not a boundary fix. The four
   `SessionRecord` call sites build a `Session` directly instead.

Six of the seven crossings are closed after step 3, before `api` is touched at all. That is the main
practical gain of building alongside: the goal is reached without waiting on the largest rewrite.

### Stage A4 — Delete the old implementation

Remove the moved parts of `api/helper/auth`, leaving the browser auth flow: `app_refresh_cookie.go`,
`esi_oauth_storage_cookie.go`, `refresh_credential_log.go`, `refresh_token_rotation.go`,
`tenant_affinity_cookie.go` and `RevokeRefreshTokensForLogout`, importing `shared/plannersession` for
`RefreshTokenTTL` and nothing else from it.

Delete the differential harness with it — it has no second subject once the old package is gone — and
fold any case it covers that the new package's own tests do not into `shared/plannersession`.

**Done when:** `api/helper/auth` holds only the browser auth flow and the EVE SSO token helpers, and
nothing outside `shared/plannersession` names `*eipredis.Redis` to reach a session.

### Stage B — HTTP middleware

Move the two constructors and the composition kit to `shared/httpmiddleware`, repoint `api/app.go`
and `websocket/app.go`. The seventh crossing closes here.

Done in place rather than alongside: 208 lines, no stored state, two call sites, and nothing a
differential test could observe that the compiler does not.

### Stage C — Guard

A test that fails when a service imports another service, so the rule stops depending on someone
noticing. `services/` is a single Go module, so the test can walk the package graph directly.

Home: the repo-root `testing` module, which may import service packages.

**Done when:** the cross-service scan below reports nothing, and Stage C fails if that changes.

```
for svc in api core worker websocket ws-router capacity-controller; do
  for other in api core worker websocket ws-router capacity-controller; do
    [ "$svc" = "$other" ] && continue
    grep -rl "eve-industry-planner/$other/" --include='*.go' $svc/ | grep -v _test.go
  done
done
```


## Wire compatibility

**Additive / none.** This moves Go packages, rewrites imports and renames Go identifiers; no
message, HTTP contract or persisted shape changes. Session **key formats and Redis layouts must not
change** while moving, or the move stops being a refactor: a rename there is a data migration and
belongs in its own change.

Two places where that bites, given § Naming:

- **Struct tags are the persisted shape.** `Session` and `AccountRecord` are written to Redis as
  JSON. Renaming the Go types and fields must leave every `json:"…"` tag exactly as it is —
  `session_id`, `reauth_required_at`, `grants_version` and the rest. A renamed field with its tag
  carried along is safe; a renamed tag is a live data break with no upgrader behind it.
- **Cookie and header names are a browser contract.** `AppSessionCookieName`,
  `PlannerSessionIDHeader` and `PlannerSessionIDQueryParam` may lose their Go prefixes, but the
  string values they hold are what a live session in a browser depends on and do not change.

## Stage status

| Stage | Status |
|-------|--------|
| Phase 1 — project folder and docs | Done |
| A1 — build the new package | Done |
| A2 — differential harness | Not started |
| A3 — cut the call sites over | Not started |
| A4 — delete the old implementation | Not started |
| B — HTTP middleware | Not started |
| C — guard test | Not started |

## Handoff

**Start here:** Stage A2 — the differential harness. `shared/plannersession` exists and is green,
and `api/helper/auth` still runs everything, so both sides of the comparison are in place.

**Known context:**

- The rule is not written down in [`../../technical-rules.md`](../../technical-rules.md), which
  states only the `services` ↔ `deployment-tool` no-cross rule. Adding it belongs with this
  project's promote, so the rule and its guard land together.
- `go fix -diff` is clean on `api/helper/auth` and on the three new packages. It is still due on
  `api/middleware` and on the calling packages, scoped to those paths, before Stage A3 edits them.
- `testing/ws_soak/lib` is in the rewrite. The repo-root `testing` module may import service
  packages, so this is a repoint like any other, not a boundary problem.
- `services/services/` is an empty stray directory — local litter, untracked (git cannot hold an
  empty directory). Not this project's work, but it sits in the scan path.
